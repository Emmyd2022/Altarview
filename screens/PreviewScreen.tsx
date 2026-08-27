import { OutputStage, type DisplayContent } from './OutputStage'
import type { ThemeDef } from '../themeModel'

export default function PreviewScreen({
  content,
  onExit,
  theme,
}: {
  content: DisplayContent | null
  onExit?: () => void
  theme?: ThemeDef | null
}) {
  return <OutputStage content={content} badgeLabel="PREVIEW" badgeColor="#A8702E" onExit={onExit} theme={theme} />
}
