import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

interface DisclaimerBannerProps {
  compact?: boolean;
}

export function DisclaimerBanner({ compact = false }: DisclaimerBannerProps) {
  if (compact) {
    return (
      <div className="bg-warning/10 border-y border-warning/20 py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span>
            <strong className="text-foreground">Medical Disclaimer:</strong> This platform provides informational support only and does not replace professional medical advice.
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-warning/10 border border-warning/30 rounded-xl p-4 md:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
        <div>
          <h4 className="font-display font-semibold text-foreground mb-1">
            Important Medical Disclaimer
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform provides informational support only and does not replace professional medical advice. 
            The AI-generated insights are not diagnoses and should never be used as a substitute for consultation 
            with qualified healthcare professionals. Always seek the advice of your physician or other qualified 
            health provider with any questions you may have regarding a medical condition.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
