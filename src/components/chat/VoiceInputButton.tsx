import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({ onTranscript, disabled, className }: VoiceInputButtonProps) {
  const { language, t } = useLanguage();
  const { isRecording, isSupported, transcript, toggleRecording } = useVoiceInput({
    onTranscript,
    language,
  });

  if (!isSupported) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant={isRecording ? 'destructive' : 'outline'}
        size="icon"
        onClick={toggleRecording}
        disabled={disabled}
        className={cn('relative', className)}
        title={t.voiceInput}
      >
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <MicOff className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <Mic className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse animation when recording */}
        {isRecording && (
          <motion.div
            className="absolute inset-0 rounded-md bg-destructive/20"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        )}
      </Button>

      {/* Transcript preview */}
      <AnimatePresence>
        {isRecording && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg max-w-xs"
          >
            <p className="text-sm text-muted-foreground">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
