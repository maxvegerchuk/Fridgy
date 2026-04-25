import { BottomSheet, Button } from '../ui';
import { useToast } from '../ui';
import { Globe } from 'phosphor-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  link: string;
  title?: string;
};

export default function ShareSheet({ isOpen, onClose, link, title = 'Share' }: Props) {
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast('Link copied!', 'success');
    } catch {
      toast('Could not copy — try long-pressing the link', 'error');
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg">
          <Globe size={20} weight="regular" className="text-neutral-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-neutral-700 font-sans break-all leading-relaxed">{link}</p>
        </div>
        <Button size="lg" fullWidth onClick={handleCopy}>
          Copy Link
        </Button>
      </div>
    </BottomSheet>
  );
}
