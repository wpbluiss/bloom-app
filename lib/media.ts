import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

export interface PickedMedia {
  uri: string;
  mediaType: 'photo' | 'video';
  ext: string;
  contentType: string;
}

const VIDEO_CAP_BYTES = 50 * 1024 * 1024; // ~50MB

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
    videoMaxDuration: 120,
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
        'That video is quite large',
        'Videos over about 50MB take a long time to upload. Consider trimming it first — you can still try uploading it.',
      );
    }
    const ext = extFrom(asset.uri, 'mov');
    return { uri: asset.uri, mediaType: 'video', ext, contentType: `video/${ext === 'mov' ? 'quicktime' : ext}` };
  }
  // Compress photos before upload
  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    [{ resize: { width: 1600 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );
  return { uri: manipulated.uri, mediaType: 'photo', ext: 'jpg', contentType: 'image/jpeg' };
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
