import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Users, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  return (
    <main>
      <section className="bg-hero">
        <div className="container py-24 md:py-32 grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-8">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Brand discovery, properly synthesized
            </span>
            <h1 className="font-display text-5xl md:text-7xl mt-6 leading-[0.95]">
              Get every stakeholder
              <br />
              <em className="text-accent not-italic">on the same page.</em>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mt-8 max-w-xl">
              Send a single link to founders, marketers, and customers. We'll
              collect their views on voice, values, and audience — then turn the
              overlap into a brief your creative team can build on.
            </p>
            <div className="flex gap-3 mt-10">
              <Link to={user ? "/dashboard" : "/auth"}>
                <Button size="lg" className="rounded-none">
                  {user ? "Go to dashboard" : "Start a survey"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:col-span-4 hidden md:block">
            <div className="border-l border-border pl-6">
              <p className="font-display text-2xl leading-snug">
                "Every brand sounds the same until you ask the people who built
                it."
              </p>
              <p className="text-sm text-muted-foreground mt-3">— Field note</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-24 grid md:grid-cols-3 gap-10">
        {[
          {
            icon: FileText,
            title: "Create a survey",
            body: "One survey per brand engagement. Linked to a project in your hub.",
          },
          {
            icon: Users,
            title: "Share with stakeholders",
            body: "Public submission link. No accounts, no friction. They answer; you collect.",
          },
          {
            icon: Sparkles,
            title: "Synthesize with AI",
            body: "A Brand Strategist persona pulls overlapping themes into a structured brief.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title}>
            <Icon className="h-6 w-6 text-accent" />
            <h3 className="font-display text-2xl mt-4">{title}</h3>
            <p className="text-muted-foreground mt-2">{body}</p>
          </div>
        ))}
      </section>
    </main>
  );
};

export default Index;
