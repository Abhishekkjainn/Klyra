import Actions from "../components/actions";
import Header from "../components/header";

export default function Documentation({ user, sessionLoading, refreshSession }) {
  return (
    <div className="doc-container">
      <Header />
      <Actions user={user} sessionLoading={sessionLoading} refreshSession={refreshSession} />

      <div className="doc-body">
        <aside className="doc-sidebar">
          <nav>
            <ul>
              <li><a href="#overview">Overview</a></li>
              <li><a href="#installation">Installation</a></li>
              <li><a href="#usage">Usage</a></li>
              <li><a href="#api">API Reference</a></li>
              <li><a href="#examples">Examples</a></li>
            </ul>
          </nav>
        </aside>

        <main className="doc-content">
          <section id="overview">
            <h2>Overview</h2>
            <p>This documentation guides you through the integration and usage of the available analytics functions.</p>
          </section>

          <section id="installation">
            <h2>Installation</h2>
            <pre><code>npm install analytics-lib</code></pre>
          </section>

          <section id="usage">
            <h2>Usage</h2>
            <p>Import and use the functions as needed in your application.</p>
          </section>

          <section id="api">
            <h2>API Reference</h2>
            <ul>
              <li><strong>usePageAnalytics</strong> – Tracks page views automatically.</li>
              <li><strong>sendButtonClickAnalytics</strong> – Sends analytics when buttons are clicked.</li>
              <li><strong>useUserJourneyAnalytics</strong> – Tracks user flow throughout the app.</li>
              <li><strong>sendDeviceInfoAnalytics</strong> – Sends device/browser-specific info.</li>
              <li><strong>useActiveUserTracker</strong> – Tracks how long a user stays active.</li>
            </ul>
          </section>

          <section id="examples">
            <h2>Examples</h2>
            <pre><code>{`import { usePageAnalytics } from "analytics-lib";

function MyComponent() {
  usePageAnalytics();
  return <div>Hello!</div>;
}`}</code></pre>
          </section>
        </main>
      </div>
    </div>
  );
}
