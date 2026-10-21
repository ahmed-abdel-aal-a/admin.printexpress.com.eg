'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AVAILABLE_ICONS = [
  'BookOpen', 'FileText', 'Image', 'Printer', 'Briefcase', 'Layers', 
  'Layout', 'Sticker', 'Box', 'CreditCard', 'Bookmark', 'Tag', 'Palette', 'FileImage'
];

interface IconSelectProps {
  value?: string | null;
  onChange: (value: string) => void;
}

export const IconSelect: React.FC<IconSelectProps> = ({ value, onChange }) => {
  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger className="w-full text-right" dir="rtl">
        <SelectValue placeholder="اختر أيقونة" />
      </SelectTrigger>
      <SelectContent dir="rtl">
        {AVAILABLE_ICONS.map((iconName) => {
          // Dynamic icon rendering
          const IconComponent = (Icons as any)[iconName];
          return (
            <SelectItem key={iconName} value={iconName}>
              <div className="flex items-center gap-2">
                {IconComponent && <IconComponent className="w-4 h-4" />}
                <span>{iconName}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};
