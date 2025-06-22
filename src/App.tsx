import { Center, Image, MantineProvider, NavLink, Title } from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { FaHome } from "react-icons/fa";

function App() {
  function log(message: string, level?: "info" | "warn" | "error") {
    console.log(
      `[benjsfood] [${new Date().toISOString().split("T")[1].split("Z")[0]}] [${
        level?.toUpperCase() || "INFO"
      }] ${message}`
    );
  }

  function saveToStorage(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
    sessionStorage.setItem(key, JSON.stringify(value));
    document.cookie = `${key}=${JSON.stringify(
      value
    )}; path=/; max-age=31536000;`; // 1 year
  }

  function getFromStorage(key: string) {
    const localValue = localStorage.getItem(key);
    if (localValue) return JSON.parse(localValue);
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) return JSON.parse(sessionValue);
    const cookieValue = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`));
    if (cookieValue) {
      return JSON.parse(cookieValue.split("=")[1]);
    }
    log(`No value found for key: ${key}`, "warn");
    return null;
  }

  return (
    <MantineProvider>
      <div className="nav">
        <Center p="md">
        <Title order={2}>BenJSfood</Title></Center>
        <NavLink label="Home" leftSection={<FaHome size={16} />} />
      </div>
      <div className="content">Content</div>
    </MantineProvider>
  );
}

export default App;
