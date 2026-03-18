import Markdown from "react-native-markdown-display";

interface MarkdownBlockProps {
  content: string | null | undefined;
}

export function MarkdownBlock({ content }: MarkdownBlockProps) {
  if (!content) {
    return null;
  }

  return (
    <Markdown
      style={{
        body: {
          color: "#1B4332",
          fontFamily: "Montserrat_400Regular",
          fontSize: 16,
          lineHeight: 26,
        },
        bullet_list: {
          marginVertical: 0,
        },
        heading2: {
          color: "#1B4332",
          fontFamily: "Montserrat_700Bold",
          fontSize: 18,
          marginBottom: 8,
          marginTop: 16,
        },
        paragraph: {
          marginBottom: 12,
        },
      }}
    >
      {content}
    </Markdown>
  );
}
