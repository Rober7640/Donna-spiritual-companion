import { CRISIS_RESOURCES } from "@shared/constants";
import { Phone, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CrisisResources() {
  return (
    <Card className="border-red-200 bg-red-50/50 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-red-900 mb-3">
        If you're in crisis, please reach out:
      </h3>
      <div className="space-y-2">
        {CRISIS_RESOURCES.map((resource) => (
          <a
            key={resource.name}
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg bg-white p-3 border border-red-100 hover:border-red-300 transition-colors"
          >
            {resource.action.startsWith("Call") ? (
              <Phone className="h-4 w-4 text-red-600 flex-none" />
            ) : (
              <MessageCircle className="h-4 w-4 text-red-600 flex-none" />
            )}
            <div>
              <p className="text-sm font-medium text-slate-900">{resource.name}</p>
              <p className="text-xs text-red-700">{resource.action}</p>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
}
