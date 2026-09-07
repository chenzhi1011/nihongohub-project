import {
  BookOpen,
  FileText,
  GraduationCap,
  Headphones,
  MessageCircle,
  PenTool,
  Plane,
  Star,
  Wrench,
} from 'lucide-react';
import type { CategoryMetadata } from './types';

export const categories: CategoryMetadata[] = [
  { id: 'basic', nameKey: 'basicLearning', icon: BookOpen },
  { id: 'exam', nameKey: 'examPrep', icon: GraduationCap },
  { id: 'listening', nameKey: 'listening', icon: Headphones },
  { id: 'speaking', nameKey: 'speaking', icon: MessageCircle },
  { id: 'reading', nameKey: 'reading', icon: FileText },
  { id: 'writing', nameKey: 'writing', icon: PenTool },
  { id: 'tools', nameKey: 'tools', icon: Wrench },
  { id: 'japan', nameKey: 'studyInJapan', icon: Plane },
  { id: 'weekly', nameKey: 'weeklyPicks', icon: Star },
];
