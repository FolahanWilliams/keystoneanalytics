import { Link } from "react-router-dom";
import { Activity, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Activity className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">Keystone Analytics</span>
        </Link>
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 17, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Keystone Analytics ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our trading intelligence platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Email address when you create an account</li>
              <li>Payment information processed securely through Stripe</li>
              <li>Usage data and preferences within the platform</li>
            </ul>
            
            <h3 className="text-lg font-medium mb-2 mt-4">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Device information (browser type, operating system)</li>
              <li>IP address and general location</li>
              <li>Pages visited and features used</li>
              <li>Time spent on the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide and maintain our services</li>
              <li>To process transactions and send related information</li>
              <li>To send you technical notices and support messages</li>
              <li>To respond to your comments and questions</li>
              <li>To improve our platform and develop new features</li>
              <li>To detect, prevent, and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect 
              your personal information. However, no method of transmission over the Internet 
              or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use third-party services that may collect information used to identify you:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li><strong>Stripe</strong> - For payment processing</li>
              <li><strong>Market Data Providers</strong> - For real-time financial data</li>
              <li><strong>Analytics Services</strong> - To understand platform usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have rights to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 mt-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar tracking technologies to enhance your experience. 
              You can instruct your browser to refuse all cookies or indicate when a cookie 
              is being sent. However, some features may not function properly without cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              changes by posting the new Privacy Policy on this page and updating the 
              "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-primary mt-2">support@keystoneanalytics.org</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border/50">
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <span>© 2026 Keystone Analytics. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
