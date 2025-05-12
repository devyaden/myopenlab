import type { ReactNode } from "react";

interface FeatureCardProps {
  children: ReactNode;
  className?: string;
}

function FeatureCard({ children, className = "" }: FeatureCardProps) {
  return (
    <div
      className={`bg-yadn-background/50 border border-yadn-foreground/10 rounded-2xl p-6 flex items-center justify-center ${className}`}
    >
      {children}
    </div>
  );
}

export default function FeaturesGrid() {
  return (
    <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-12 gap-4 bg-yadn-background/50">
      {/* Row 1 */}
      <div className="col-span-4 md:col-span-8 lg:col-span-4">
        <FeatureCard>
          <div className="flex items-center space-x-3">
            <span className="text-lg font-medium">Up to</span>
            <span className="bg-yadn-accent-green text-background px-3 py-1 rounded-md text-xl font-bold">
              Unlimited
            </span>
            <span className="text-lg font-medium">canvas size</span>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-4">
        <FeatureCard>
          <div className="text-center">
            <div className="text-5xl font-bold">3</div>
            <div className="text-yadn-foreground/70 mt-1">view types</div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-4">
        <FeatureCard>
          <div className="text-center">
            <div className="text-2xl font-medium">Nested</div>
            <div className="text-3xl font-bold">shapes</div>
            <div className="text-yadn-foreground/70 mt-1">
              for complex diagrams
            </div>
          </div>
        </FeatureCard>
      </div>

      {/* Row 2 */}
      <div className="col-span-2">
        <FeatureCard>
          <div className="text-center">
            <div className="text-4xl font-bold">∞</div>
            <div className="text-yadn-foreground/70 text-sm">connections</div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-2">
        <FeatureCard>
          <div className="text-center">
            <div className="text-4xl font-bold">5+</div>
            <div className="text-yadn-foreground/70 text-sm">
              export formats
            </div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-4 md:col-span-4 lg:col-span-4">
        <FeatureCard>
          <div className="text-center">
            <div className="text-3xl font-bold">Real-time</div>
            <div className="text-yadn-foreground/70">collaboration</div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-2">
        <FeatureCard>
          <div className="text-center">
            <div className="text-4xl font-bold">100%</div>
            <div className="text-yadn-foreground/70 text-sm">responsive</div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-2">
        <FeatureCard>
          <div className="text-center">
            <div className="text-4xl font-bold">24/7</div>
            <div className="text-yadn-foreground/70 text-sm">cloud access</div>
          </div>
        </FeatureCard>
      </div>

      {/* Row 3 */}
      <div className="col-span-4">
        <FeatureCard>
          <div className="text-center">
            <div className="gradient-text text-5xl font-bold">Smart</div>
            <div className="text-yadn-foreground/70">auto-layout</div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-4 md:col-span-8 lg:col-span-4">
        <FeatureCard className="h-full">
          <div className="relative w-full h-[120px] flex items-center justify-center">
            <div className="absolute inset-0 bg-yadn-accent-green/5 rounded-xl"></div>
            <div className="relative z-10 text-center">
              <div className="text-3xl font-bold mb-1">
                Canvas → Table → Doc
              </div>
              <div className="text-yadn-foreground/70">seamless conversion</div>
            </div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-4">
        <FeatureCard>
          <div className="text-center">
            <div className="text-3xl font-bold">Connected</div>
            <div className="text-yadn-foreground/70">diagrams</div>
          </div>
        </FeatureCard>
      </div>

      {/* Row 4 */}
      <div className="col-span-4">
        <FeatureCard>
          <div className="text-center">
            <div className="text-2xl font-medium">Folder</div>
            <div className="text-3xl font-bold">System</div>
            <div className="text-yadn-foreground/70 mt-1">for organization</div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-4 md:col-span-4 lg:col-span-4">
        <FeatureCard>
          <div className="flex items-center justify-center space-x-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7 10V14L11 12L7 10Z" fill="#09BC8A" />
              <circle cx="12" cy="12" r="9" stroke="#09BC8A" strokeWidth="2" />
            </svg>
            <div className="text-center">
              <div className="text-2xl font-bold">One-click</div>
              <div className="text-yadn-foreground/70">sharing</div>
            </div>
          </div>
        </FeatureCard>
      </div>

      <div className="col-span-4">
        <FeatureCard>
          <div className="text-center">
            <div className="text-3xl font-bold">PDF, JSON</div>
            <div className="text-2xl font-bold">CSV, XLSX</div>
            <div className="text-yadn-foreground/70 mt-1">export options</div>
          </div>
        </FeatureCard>
      </div>
    </div>
  );
}
