import { Link } from "react-router-dom";
import { Activity, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Activity className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">Pulse Terminal</span>
        </Link>
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 17, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Pulse Terminal, you agree to be bound by these Terms of Service. 
              If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pulse Terminal is a trading intelligence platform that provides market data, 
              technical analysis tools, charting capabilities, and educational resources. 
              Our service is designed to help traders make more informed decisions.
            </p>
          </section>

          <section className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <h2 className="text-2xl font-semibold mb-4 text-destructive">3. Investment Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">IMPORTANT:</strong> Pulse Terminal does not provide 
              investment advice, financial advice, trading advice, or any other sort of advice. 
              The information provided by our platform is for informational and educational purposes only.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-4">
              <li>Past performance is not indicative of future results</li>
              <li>Trading involves substantial risk of loss and is not suitable for all investors</li>
              <li>You should consult a licensed financial advisor before making investment decisions</li>
              <li>Any "verdicts," "signals," or "recommendations" are algorithmic outputs, not professional advice</li>
              <li>We are not liable for any financial losses incurred from using our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you create an account, you must provide accurate and complete information. 
              You are responsible for safeguarding your account credentials and for all activities 
              under your account. You must notify us immediately of any unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Subscriptions and Payments</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Subscriptions are billed in advance on a recurring basis</li>
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>Refunds are handled on a case-by-case basis at our discretion</li>
              <li>Prices are subject to change with notice</li>
              <li>Payments are processed securely through Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service</li>
              <li>Scrape, copy, or redistribute our data without permission</li>
              <li>Share your account credentials with others</li>
              <li>Use automated systems to access the service excessively</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The service and its original content, features, and functionality are owned by 
              Pulse Terminal and are protected by international copyright, trademark, and 
              other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Data Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed">
              While we strive to provide accurate market data, we do not guarantee the accuracy, 
              completeness, or timeliness of any information. Market data may be delayed. 
              Always verify information with official sources before making trading decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall Pulse Terminal, its directors, employees, partners, agents, 
              or affiliates be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including loss of profits, data, or goodwill, arising from 
              your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice, 
              for any reason, including breach of these Terms. Upon termination, your right 
              to use the service will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. We will provide notice 
              of any material changes. Continued use of the service after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-primary mt-2">legal@pulseterminal.app</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border/50">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <span>© 2026 Pulse Terminal. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
