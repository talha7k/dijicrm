import type { NavItem, SidebarNav, SocialLink } from "$lib/types/nav";

export const siteConfig = {
  title: "Dijicrm",
  description:
    "A multi-dashboard portal for clients and companies to manage invoices. Built with SvelteKit and Firebase, this CRM system provides separate dashboards for client access and company administration, featuring invoice management, billing, notifications, and account settings.",
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
    title: "Features",
    url: "/features",
  },
  {
    title: "Pricing",
    url: "/pricing",
  },

  {
    title: "Blog",
    url: "/blog",
  },
  {
    title: "Contact",
    url: "/contact",
  },
];

export const appNavItems: SidebarNav[] = [
  {
    title: "Platform",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: "lucide:layout-dashboard",
      },
    ],
  },
];

export const socialLinks: SocialLink[] = [
  {
    title: "talha7k",
    url: "https://www.linkedin.com/in/talha7k/",
    icon: "linkedin",
  },
  {
    title: "talha7k",
    url: "https://github.com/talha7k/dijicrm.git",
    icon: "github",
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
        "Basic invoice management",
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
        "Basic invoice management",
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
