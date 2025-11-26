import React from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={styles.logo}>HYBRID MLM</h2>

        <div style={styles.menuItem}>Dashboard</div>
        <div style={styles.menuItem}>Pair Income</div>
        <div style={styles.menuItem}>Level Income</div>
        <div style={styles.menuItem}>PV/BV Details</div>
        <div style={styles.menuItem}>Franchise</div>

        <button style={styles.logout} onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        <h1 style={styles.title}>Welcome to Dashboard</h1>
        <p style={styles.subtitle}>Hybrid MLM Plan — Admin Panel</p>

        <div style={styles.cardRow}>
          <div style={styles.card}>
            <h3>Total Directs</h3>
            <p>0</p>
          </div>

          <div style={styles.card}>
            <h3>Total Team</h3>
            <p>0</p>
          </div>

          <div style={styles.card}>
            <h3>Total Income</h3>
            <p>₹0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100%",
    background: "#f8f9fa",
  },
  sidebar: {
    width: "230px",
    background: "#343a40",
    color: "white",
    padding: "20px 15px",
    display: "flex",
    flexDirection: "column",
  },
  logo: {
    fontSize: "20px",
    marginBottom: "30px",
    textAlign: "center",
  },
  menuItem: {
    padding: "12px",
    background: "#495057",
    borderRadius: "6px",
    marginBottom: "10px",
    cursor: "pointer",
  },
  logout: {
    marginTop: "auto",
    padding: "10px",
    width: "100%",
    border: "none",
    borderRadius: "6px",
    background: "#dc3545",
    color: "white",
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: "25px",
  },
  title: {
    fontSize: "28px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#555",
    marginBottom: "25px",
  },
  cardRow: {
    display: "flex",
    gap: "20px",
  },
  card: {
    flex: 1,
    padding: "20px",
    background: "white",
    borderRadius: "10px",
    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
};
