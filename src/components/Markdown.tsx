import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Fragment, type ReactNode } from 'react';
import { Linking, StyleSheet, Text as RNText, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { parseBlocks, parseInline, type Block, type Inline } from './markdownParse.ts';

/** In-app routes for links between the bundled policies. Anything else starting with "/" is ignored. */
const INTERNAL: Record<string, string> = {
  '/privacy-policy': '/legal/privacy',
  '/consumer-health-data-privacy-policy': '/legal/health-privacy',
};

function openLink(href: string) {
  const internal = INTERNAL[href.split('#')[0]];
  if (internal) {
    router.push(internal as never);
  } else if (/^https:\/\//i.test(href)) {
    void WebBrowser.openBrowserAsync(href).catch(() => {});
  } else if (/^mailto:/i.test(href)) {
    void Linking.openURL(href).catch(() => {});
  }
  // other schemes (javascript:, http:, relative) are never opened
}

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  return (
    <View style={{ gap: 12 }}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </View>
  );
}

function Inlines({ nodes, bold, italic }: { nodes: Inline[]; bold?: boolean; italic?: boolean }): ReactNode {
  const { colors, fonts } = useTheme();
  return nodes.map((n, i) => {
    switch (n.t) {
      case 'text':
        return (
          <RNText key={i} style={[bold && { fontFamily: fonts.bodySemi }, italic && { fontStyle: 'italic' }]}>
            {n.s}
          </RNText>
        );
      case 'bold':
        return <Inlines key={i} nodes={n.c} bold italic={italic} />;
      case 'italic':
        return <Inlines key={i} nodes={n.c} bold={bold} italic />;
      case 'code':
        return (
          <RNText key={i} style={{ fontFamily: 'monospace', backgroundColor: colors.surfaceSunken }}>
            {n.s}
          </RNText>
        );
      case 'link':
        return (
          <RNText
            key={i}
            accessibilityRole="link"
            onPress={() => openLink(n.href)}
            style={{ color: colors.accentInk, textDecorationLine: 'underline', fontFamily: bold ? fonts.bodySemi : undefined }}
          >
            <Inlines nodes={n.c} bold={bold} italic={italic} />
          </RNText>
        );
    }
  });
}

function BlockView({ block }: { block: Block }) {
  const { colors, type, fonts } = useTheme();
  switch (block.t) {
    case 'heading': {
      const style =
        block.level === 1
          ? { fontFamily: fonts.displayHeavy, fontSize: 32, lineHeight: 34, textTransform: 'uppercase' as const }
          : block.level === 2
            ? { fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 28, marginTop: 12 }
            : { fontFamily: fonts.bodySemi, fontSize: block.level === 3 ? 18 : 16, lineHeight: 24, marginTop: 4 };
      return (
        <RNText accessibilityRole="header" style={[style, { color: colors.text }]}>
          <Inlines nodes={block.c} />
        </RNText>
      );
    }
    case 'p':
      return (
        <RNText style={[type.body, { color: colors.text }]}>
          <Inlines nodes={block.c} />
        </RNText>
      );
    case 'hr':
      return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: 8 }} />;
    case 'quote':
      return (
        <View style={{ borderLeftWidth: 3, borderLeftColor: colors.accentLine, paddingLeft: 12, gap: 8 }}>
          {block.c.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}
        </View>
      );
    case 'list':
      return (
        <View style={{ gap: 6 }}>
          {block.items.map((it, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingLeft: it.depth * 16 }}>
              <RNText style={[type.body, { color: colors.textMuted, minWidth: 20 }]}>{block.ordered && it.depth === 0 ? `${it.n}.` : '•'}</RNText>
              <RNText style={[type.body, { color: colors.text, flex: 1 }]}>
                <Inlines nodes={it.c} />
              </RNText>
            </View>
          ))}
        </View>
      );
    case 'table':
      // Readable on a phone: each row becomes a small card of "Column: value" lines (no horizontal scrolling).
      return (
        <View style={{ gap: 10 }}>
          {block.rows.map((row, r) => (
            <View key={r} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.surface, padding: 12, gap: 6 }}>
              {row.map((cell, c) => (
                <Fragment key={c}>
                  <RNText style={[type.small, { color: colors.textMuted, fontFamily: fonts.bodyMedium }]}>
                    <Inlines nodes={block.head[c] ?? parseInline('')} />
                  </RNText>
                  <RNText style={[type.small, { color: colors.text }]}>
                    <Inlines nodes={cell} />
                  </RNText>
                </Fragment>
              ))}
            </View>
          ))}
        </View>
      );
  }
}

