import { OutputStage, type DisplayContent } from './OutputStage'

export default function PreviewScreen({
  content,
  onExit,
}: {
  content: DisplayContent | null
  onExit?: () => void
}) {
  return <OutputStage content={content} badgeLabel="PREVIEW" badgeColor="#A8702E" onExit={onExit} />
}
