import { Center, Image, MantineProvider, NavLink, Title } from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { FaHome } from "react-icons/fa";
import { BiFoodMenu } from "react-icons/bi";

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

  function isMobile() {
    let is =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform)) ||
      window.innerWidth <= 800;
    log(`isMobile: ${is}`);
    return is;
  }

   function getFoodInfo(barcode: string = "5000168194189") {
    fetch(`https://world.openfoodfacts.net/api/v2/product/${barcode}.json`)
      .then((response) => response.json())
      .then((data) => {
        log("Food info fetched successfully");
        if (data.status === 1) {
          log(`Product found: ${data.product.product_name}`);
          saveToStorage("foodInfo", data.product);
          alert(`Product: ${data.product.product_name}`);
        } else {
          log("Product not found", "warn");
          alert("Product not found");
        }
      })
      .catch((error) => {
        log(`Error fetching food info: ${error}`, "error");
      });
  }

  return (
    <MantineProvider>
      <div className="nav">
        {isMobile() ? (
          <></>
        ) : (
          <Center p="md">
            <Title order={2}>BenJSfood</Title>
          </Center>
        )}
        <NavLink
          label="Dashboard"
          className="navlink"
          href="/"
          leftSection={<FaHome className="nlicon" size={16} />}
        />
        <NavLink
          label="Food Search"
          className="navlink"
          href="?p=2"
          leftSection={<BiFoodMenu className="nlicon" size={16} />}
        />
      </div>
      <div className="content">
        {window.location.href.split("?p=")[1] == "2" ? <>
          {/* Display food search page content here */}
          <Title order={3} className="content-title">Food Search</Title>
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Open_Food_Facts_logo.svg/1200px-Open_Food_Facts_logo.svg.png"
            alt="Open Food Facts Logo"
            className="content-image"
          />
          <Title order={4} className="content-subtitle">Search for food products</Title>
          <button onClick={() => getFoodInfo("5000168194189")} className="content-button">
          </button>
        </> : <>h</>}
      </div>
    </MantineProvider>
  );
}

export default App;
