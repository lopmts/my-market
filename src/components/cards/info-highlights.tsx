import { Bike, CreditCard, Headset, Leaf, type LucideIcon } from "lucide-react";

type InfoItem = {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
};

const INFO_ITEMS: InfoItem[] = [
  {
    icon: Bike,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Entrega rápida",
    subtitle: "Em até 45 minutos",
  },
  {
    icon: CreditCard,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    title: "Pagamento seguro",
    subtitle: "Diversas formas de pagamento",
  },
  {
    icon: Leaf,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
    title: "Ingredientes selecionados",
    subtitle: "Qualidade em cada prato",
  },
  {
    icon: Headset,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    title: "Atendimento de qualidade",
    subtitle: "Estamos sempre prontos",
  },
];

const InfoHighlights = () => {
  return (
    <div className="w-full rounded-2xl border dark:border-zinc-800 shadow-sm dark:bg-zinc-900 bg-zinc-100 border-zinc-100 mt-4">
      <div className="grid grid-cols-1 divide-y dark:divide-gray-800 divide-gray-300 sm:grid-cols-2 sm:divide-y lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {INFO_ITEMS.map((item) => (
          <div key={item.title} className="flex items-center gap-3 px-6 py-5">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${item.iconBg}`}
            >
              <item.icon className={`h-5 w-5 ${item.iconColor}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.title}
              </span>
              <span className="text-xs dark:text-gray-300 text-gray-500">
                {item.subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoHighlights;
