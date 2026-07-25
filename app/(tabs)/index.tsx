        {/* This week */}
        <FadeIn index={9}>
          <Text style={[styles.eyebrow, { marginTop: spacing.section }]}>{copy.today.thisWeek}</Text>
          <TipCard eyebrow={copy.today.babyEyebrow} body={info.development} />
          {isPartner ? (
            <>
              <TipCard eyebrow={copy.today.forYou} body={partnerTip} />
              <TipCard eyebrow={copy.today.forHer} body={momTip} />
            </>
          ) : (
            <>
              <TipCard eyebrow={copy.today.forYou} body={momTip} />
              <TipCard eyebrow={copy.today.forPartner} body={partnerTip} />
            </>
          )}
        </FadeIn>

        {/* The day closes on purpose — no dead space at the bottom */}
        <FadeIn index={10}>
          <View style={styles.dayClose}>
            <View style={styles.dayCloseDot} />
            <Text style={styles.dayCloseText}>{copy.today.dayClose}</Text>
            <View style={styles.dayCloseDot} />
          </View>
        </FadeIn>
      </ScrollView>