
import Aurora from '../components/Aurora.jsx';
import './LoginPage.css';

export default function LoginPage() {
  function handleLogin(event) {
    event.preventDefault();

    // Demo login only — no credentials are verified.
    window.location.hash = '/';
  }

  return (
    <main className="login-page">
      <Aurora
        colorStops={['#7cff67', '#B497CF', '#5227FF']}
        blend={0.5}
        amplitude={1}
        speed={1}
      />

      <section className="login-card">
        <div className="login-brand">
          <span className="login-brand-mark">A</span>
          <span>ACES</span>
        </div>

        <p className="login-eyebrow">WELCOME BACK</p>
        <h1>Sign in to your account</h1>
        <p className="login-description">
          Find borrower matches that fit your lending preferences.
        </p>

        <form onSubmit={handleLogin}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />

          <button type="submit" className="login-button">
            Sign in <span aria-hidden="true">→</span>
          </button>
        </form>

       
      </section>

      
    </main>
  );
}
