import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export interface PickedMedia {
  uri: string;
  mediaType: 'photo' | 'video';
  ext: string;
  contentType: string;
}

const VIDEO_CAP_BYTES = 50 * 1024 * 1024; // ~50MB (Supabase free-plan per-file ceiling)

/** Pick an image or video from the library; photos are compressed before upload. */
export async function pickMedia(opts: { allowsVideo?: boolean } = {}): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Photos access needed', 'Bloom needs permission to reach your photo library.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: opts.allowsVideo ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    // Ten minutes — a full gender reveal, not a clip of one. (Delia bug report:
    // the old 2-minute picker cap made her announcement video unselectable.)
    videoMaxDuration: 600,
  });
  if (result.canceled || !result.assets?.length) return null;
  return processAsset(result.assets[0]);
}

export async function capturePhoto(): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Camera access needed', 'Bloom needs camera permission to take a photo.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
  if (result.canceled || !result.assets?.length) return null;
  return processAsset(result.assets[0]);
}

async function processAsset(asset: ImagePicker.ImagePickerAsset): Promise<PickedMedia | null> {
  const isVideo = asset.type === 'video';
  if (isVideo) {
    const size = asset.fileSize ?? 0;
    if (size > VIDEO_CAP_BYTES) {
      Alert.alert(
        'A bigger video — that’s okay',
        'Videos over about 50MB upload slowly on weaker connections. It will still upload — just keep Bloom open while it does.',
      );
    }
    const ext = extFrom(asset.uri, 'mov');
    return { uri: asset.uri, mediaType: 'video', ext, contentType: `video/${ext === 'mov' ? 'quicktime' : ext}` };
  }
  // Compress before upload (Luis/Delia: phones shoot 4–8MB photos; at family
  // scale that's the difference between a 2GB and a 14GB cloud bill). Long
  // edge capped at 1920 — plenty for a memory book page — JPEG ~0.72.
  // Never lose a memory to a compression hiccup: fall back to the original.
  try {
    const w = asset.width ?? 0;
    const h = asset.height ?? 0;
    const LONG_EDGE = 1920;
    const resize =
      w >= h ? [{ resize: { width: LONG_EDGE } }] : [{ resize: { height: LONG_EDGE } }];
    const manipulated = await ImageManipulator.manipulateAsync(asset.uri, resize, {
      compress: 0.72,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return { uri: manipulated.uri, mediaType: 'photo', ext: 'jpg', contentType: 'image/jpeg' };
  } catch (e) {
    console.warn('photo compression failed, keeping original', e);
    const ext = extFrom(asset.uri, 'jpg');
    return { uri: asset.uri, mediaType: 'photo', ext, contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}` };
  }
}

function extFrom(uri: string, fallback: string): string {
  const m = /\.([a-zA-Z0-9]+)(?:\?|$)/.exec(uri);
  return (m?.[1] ?? fallback).toLowerCase();
}

/** Read a local file into bytes for Supabase storage upload. */
export async function uriToBytes(uri: string): Promise<Uint8Array> {
  const res = await fetch(uri);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}
