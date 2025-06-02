import { useState } from "react";
import styles from "./RegisterForm.module.css";
import { useRouter } from "next/navigation";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    department: "warehouse",
    position: "",
    NIK: "",
    barcode: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [barcodeMessage, setBarcodeMessage] = useState("");
  const [barcodeError, setBarcodeError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Reset any existing errors
    setSuccess(""); // Reset success message

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true); // Set loading to true when the form is being submitted

    try {
      // Call the register API
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          department: formData.department,
          position: formData.position,
          NIK: formData.NIK,
          barcode: formData.barcode,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(
          registerData.message || "An error occurred during registration."
        );
      }

      setSuccess("Registration successful! Redirecting to login page...");
      setTimeout(() => router.push("/auth"), 2000); // Redirect after success
    } catch (error) {
      setError(error.message || "Failed to register. Please try again later.");
    }

    setLoading(false); // Reset loading state
  };

  // Password generator compliant with ISO 27001 (at least 12 characters with upper, lower, number, and symbol)
  function generatePassword() {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    setFormData({
      ...formData,
      password: password,
      confirmPassword: password, // Set confirmPassword to match
    });
    setShowPassword(true);
  }

  // Handle password generation
  const handleGeneratePassword = () => {
    generatePassword();
  };

  return (
    <div className={styles.container}>
      <h2>Register</h2>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
      <form onSubmit={handleSubmit}>
        {/* Name Field */}
        <div className={styles.formGroup}>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className={styles.identityGroup}>
          {/* Department */}
          <div className={styles.formGroup}>
            <label htmlFor="department">Department:</label>
            <select
              name="department" // Corrected to "department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="warehouse">Warehouse</option>
              <option value="production">Production</option>
              <option value="purchasing">Purchasing</option>
              <option value="planner">Planner</option>
            </select>
          </div>

          {/* Position */}
          <div className={styles.formGroup}>
            <label htmlFor="position">Position:</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
            >
              <option value="staff">Staff</option>
              <option value="supervisor">Supervisor</option>
              <option value="leader">Leader</option>
            </select>
          </div>

          {/* NIK */}
          <div className={styles.formGroup}>
            <label htmlFor="NIK">NIK:</label>
            <input
              type="text"
              name="NIK"
              value={formData.NIK}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Email Field */}
        <div className={styles.formGroup}>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password Field */}
        <div className={styles.formGroup}>
          <label htmlFor="password">Password:</label>
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Confirm Password Field */}
        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        {/* Generate Password Button */}
        <div className={styles.formGroup}>
          <button
            className={styles.submitButton}
            type="button"
            onClick={handleGeneratePassword}
          >
            Generate Password
          </button>
        </div>

        {/* Role Dropdown */}
        <div className={styles.formGroup}>
          <label htmlFor="role">Role:</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className={styles.formGroup}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </div>
      </form>
      {/* New Barcode Form Section */}
      <div className={styles.barcodeFormContainer}>
        <h3>Add New Barcode</h3>
        {barcodeMessage && <p className={styles.success}>{barcodeMessage}</p>}
        {barcodeError && <p className={styles.error}>{barcodeError}</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const name = e.target.barcodeName.value.trim();
            const barcode = e.target.barcodeValue.value.trim();

            if (!name || !barcode) {
              setBarcodeError("Name and barcode are required.");
              return;
            }

            try {
              const res = await fetch("/api/insertBarcode", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, barcode }),
              });

              const data = await res.json();
              if (!res.ok) throw new Error(data.message);
              setBarcodeMessage("Barcode added successfully!");
              e.target.reset();
            } catch (err) {
              setBarcodeError("Failed to add barcode: " + err.message);
            }
          }}
        >
          <div className={styles.formGroup}>
            <label htmlFor="barcodeName">Name:</label>
            <input type="text" name="barcodeName" required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="barcodeValue">Barcode:</label>
            <input type="text" name="barcodeValue" required />
          </div>
          <div className={styles.formGroup}>
            <button type="submit" className={styles.submitButton}>
              Add Barcode
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
