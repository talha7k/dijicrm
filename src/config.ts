import type { NavItem, SidebarNav, SocialLink } from "$lib/types/nav";

export const siteConfig = {
  title: "TK-Crm",
  description:
    "A multi-dashboard portal for clients and companies to manage orders. Built with SvelteKit and Firebase, this CRM system provides separate dashboards for client access and company administration, featuring order management, billing, notifications, and account settings.",
  logo: "/logo.svg",
  logoDark: "/logo.svg",
  favicon: "/favicon.png",
};

export const marketingNavItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
  },
  {
    title: "Contact",
    url: "/contact",
  },
];

export const clientNavItems: SidebarNav[] = [
  {
    title: "Client Portal",
    items: [
      {
        title: "Dashboard",
        url: "/client-dashboard",
        icon: "lucide:layout-dashboard",
      },
      {
        title: "Orders",
        url: "/client-dashboard/orders",
        icon: "lucide:file-text",
      },
      {
        title: "Payments",
        url: "/client-dashboard/payments",
        icon: "lucide:credit-card",
      },
      {
        title: "Account",
        url: "/client-dashboard/account",
        icon: "lucide:user",
      },
    ],
  },
];

export const companyNavItems: SidebarNav[] = [
  {
    title: "Company Portal",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: "lucide:layout-dashboard",
      },
      {
        title: "Products & Services",
        url: "/products",
        icon: "lucide:package",
      },
      {
        title: "Templates",
        url: "/templates",
        icon: "lucide:file-text",
      },

      {
        title: "Invoices",
        url: "/orders",
        icon: "lucide:file-text",
      },
      {
        title: "Create Invoice",
        url: "/orders/create",
        icon: "lucide:plus-circle",
      },
      {
        title: "Clients",
        url: "/clients",
        icon: "lucide:users",
      },
      {
        title: "Billing",
        url: "/billing",
        icon: "lucide:credit-card",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Account",
        url: "/account",
        icon: "lucide:user",
      },
      {
        title: "Company Settings",
        url: "/settings",
        icon: "lucide:settings",
      },
    ],
  },
];

// Legacy export for backward compatibility
export const appNavItems: SidebarNav[] = companyNavItems;

export const socialLinks: SocialLink[] = [
  {
    title: "talha7k",
    url: "https://www.linkedin.com/in/talha7k/",
    icon: "linkedin",
  },
];

export const contactInfo = {
  email: "info@codegio.com",
  phone: "+52 818 201 2602",
  address: "Monterrey, Mexico",
};

export const plans = {
  monthly: [
    {
      type: "Starter",
      price: "0",
      name: "Free Plan",
      features: [
        "Up to 10 clients",
        "Basic order management",
        "Email notifications",
        "Community support",
      ],
    },
    {
      type: "Pro",
      price: "29",
      name: "Professional",
      features: [
        "Unlimited clients",
        "Advanced billing features",
        "Priority support",
        "Custom branding",
      ],
    },
    {
      type: "Enterprise",
      price: "99",
      name: "Enterprise",
      features: [
        "Team collaboration",
        "Custom integrations",
        "Advanced security",
        "Dedicated account manager",
      ],
    },
  ],
  yearly: [
    {
      type: "Starter",
      price: "0",
      name: "Free Plan",
      features: [
        "Up to 10 clients",
        "Basic order management",
        "Email notifications",
        "Community support",
      ],
    },
    {
      type: "Pro",
      price: "290",
      name: "Professional",
      features: [
        "Unlimited clients",
        "Advanced billing features",
        "Priority support",
        "Custom branding",
      ],
    },
    {
      type: "Enterprise",
      price: "990",
      name: "Enterprise",
      features: [
        "Team collaboration",
        "Custom integrations",
        "Advanced security",
        "Dedicated account manager",
      ],
    },
  ],
};
