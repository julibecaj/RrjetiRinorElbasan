import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
const categories: { label: string; icon: IconName; href: string }[] = [
  { label: "Events", icon: "events", href: "/events" },
  { label: "Jobs", icon: "jobs", href: "/opportunities/jobs" },
  { label: "Education", icon: "education", href: "/opportunities/education" },
  {
    label: "Volunteering",
    icon: "volunteering",
    href: "/opportunities/volunteering",
  },
  { label: "Projects", icon: "projects", href: "/opportunities/projects" },
];
export function CategoryCards() {
  return (
    <Container>
      <nav className="categories" aria-label="Eksploro mundësitë">
        {categories.map((category) => (
          <Link
            className={`category category-${category.icon}`}
            href={category.href}
            key={category.icon}
          >
            <span className="category-content">
              <Icon name={category.icon} />
              <span>{category.label}</span>
            </span>
          </Link>
        ))}
      </nav>
    </Container>
  );
}
