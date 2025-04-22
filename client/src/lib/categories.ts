import { 
  ShoppingCart, 
  UtensilsCrossed, 
  Home, 
  Lightbulb, 
  Car, 
  Laptop, 
  Heart, 
  GraduationCap, 
  Wallet,
  CreditCard,
  Gift,
  Ticket,
  DollarSign,
  LucideIcon
} from "lucide-react";

export interface CategoryInfo {
  id: string;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const categories: CategoryInfo[] = [
  {
    id: "income",
    name: "Income",
    icon: DollarSign,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100"
  },
  {
    id: "shopping",
    name: "Shopping",
    icon: ShoppingCart,
    color: "text-blue-500",
    bgColor: "bg-blue-100"
  },
  {
    id: "dining",
    name: "Dining",
    icon: UtensilsCrossed,
    color: "text-purple-500",
    bgColor: "bg-purple-100"
  },
  {
    id: "housing",
    name: "Housing",
    icon: Home,
    color: "text-pink-500",
    bgColor: "bg-pink-100"
  },
  {
    id: "utilities",
    name: "Utilities",
    icon: Lightbulb,
    color: "text-green-500",
    bgColor: "bg-green-100"
  },
  {
    id: "transportation",
    name: "Transportation",
    icon: Car,
    color: "text-orange-500",
    bgColor: "bg-orange-100"
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: Laptop,
    color: "text-red-500",
    bgColor: "bg-red-100"
  },
  {
    id: "healthcare",
    name: "Healthcare",
    icon: Heart,
    color: "text-teal-500",
    bgColor: "bg-teal-100"
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    color: "text-indigo-500",
    bgColor: "bg-indigo-100"
  },
  {
    id: "personal",
    name: "Personal",
    icon: Wallet,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100"
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: CreditCard,
    color: "text-blue-600",
    bgColor: "bg-blue-50"
  },
  {
    id: "gifts",
    name: "Gifts",
    icon: Gift,
    color: "text-pink-600",
    bgColor: "bg-pink-50"
  },
  {
    id: "other",
    name: "Other",
    icon: Ticket,
    color: "text-gray-500",
    bgColor: "bg-gray-100"
  }
];

export function getCategoryById(id: string): CategoryInfo {
  return categories.find(c => c.id === id) || categories[categories.length - 1];
}
