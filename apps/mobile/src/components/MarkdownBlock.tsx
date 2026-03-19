import { useColorScheme } from "nativewind";
import Markdown from "react-native-markdown-display";

interface MarkdownBlockProps {
  content: string | null | undefined;
}

export function MarkdownBlock({ content }: MarkdownBlockProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const textColor = isDark ? "#D1E7DD" : "#1B4332";

  if (!content) {
    return null;
  }

  return (
    <Markdown
      style={{
        body: {
          color: textColor,
          fontFamily: "Montserrat_400Regular",
          fontSize: 16,
          lineHeight: 26,
        },
        bullet_list: {
          marginVertical: 0,
        },
        heading2: {
          color: textColor,
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
