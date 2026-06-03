import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [form, setForm]       = useState({ name: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await registerApi(form.name, form.email, form.password);
      login({ name: data.name, role: data.role }, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">
          Already registered?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[["Name","text","name"], ["Email","email","email"], ["Password","password","password"]].map(
            ([label, type, field]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} required value={form[field]} onChange={set(field)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
            )
          )}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium
                       rounded-lg py-2 text-sm transition-colors disabled:opacity-60">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}