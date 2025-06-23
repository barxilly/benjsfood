import { Center, Image, MantineProvider, NavLink, Space, TextInput, Title } from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { FaHome } from "react-icons/fa";
import { BiFoodMenu } from "react-icons/bi";
import {useState} from "react";

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

  async function getFoodInfo(barcode: string = "5000168194189") {
    try {
      const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${barcode}.json`);
      const data = await response.json();
      log("Food info fetched successfully");
      if (data.status === 1) {
        log(`Product found: ${data.product.product_name}`);
        return data;
      } else {
        log("Product not found", "warn");
        alert("Product not found");
        return null;
      }
    } catch (error) {
      log(`Error fetching food info: ${error}`, "error");
      return null;
    }
  }

  async function searchFoodByName(name: string) {
    setFoodInfo({});
    if (!name.match(/^[a-zA-Z\s]+$/) && name.match(/^\d+$/)) {
      log(`Searching food by barcode: ${name}`);
      getFoodInfo(name)
      .then((data) => {
        if (data && data.product) {
          setFoodInfo((prev: any) => ({
            ...prev,
            [data.product.code]: {
              name: data.product.product_name,
              ingredients: data.product.ingredients_text || "No ingredients listed",
              nutritionalInfo: data.product.nutriments || "No nutritional information available",
              code: data.product.code,
              category: data.product.categories_tags ? data.product.categories_tags.join(", ") : "No category",
              image: data.product.image_url || "No image available"
            }
          }));
          log(`Product: ${data.product.product_name}, Code: ${data.product.code}`);
        } else {
          log(`No product found for barcode: ${name}`, "warn");
          alert(`No product found for barcode: ${name}`);
        }
      })
      .catch((error) => {
        log(`Error fetching food by barcode: ${error}`, "error");
        alert(`Error fetching food by barcode: ${error}`);
      });
      return;
    }
    fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${name}&search_simple=1&json=1&page_size=10`)
      .then((response) => response.json())
      .then((data) => {
        log("Food search completed successfully");
        if (data.products && data.products.length > 0) {
          log(`Found ${data.products.length} products for "${name}"`);
          data.products.forEach((product: any) => {
            setFoodInfo((prev: any) => ({
              ...prev,
              [product.code]: {
                name: product.product_name,
                ingredients: product.ingredients_text || "No ingredients listed",
                nutritionalInfo: product.nutriments || "No nutritional information available",
                code: product.code,
                category: product.categories_tags ? product.categories_tags.join(", ") : "No category",
                image: product.image_url || "No image available"
              }
            }));
            log(`Product: ${product.product_name}, Code: ${product.code}`);
          });
        } else {
          log(`No products found for "${name}"`, "warn"); 
          alert(`No products found for "${name}"`);
        }
      })
      .catch((error) => {
        log(`Error searching food by name: ${error}`, "error");
        alert(`Error searching food by name: ${error}`);
      });
  }

  const [currentFoodSearch, setCurrentFoodSearch] = useState("");
  const [foodInfo, setFoodInfo] = useState({});

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
          <TextInput value={currentFoodSearch} onChange={(e) => setCurrentFoodSearch(e.target.value)} placeholder="Search for food by name or barcode" />
          <button onClick={() => searchFoodByName(currentFoodSearch)}>Search</button>
          <Space h="md" />
          {Object.keys(foodInfo).length > 0 ? (
            <div className="food-info">
              {Object.entries(foodInfo).map(([code, info]) => (

                <div key={code} className="food-item">
                  <Image src={info.image} alt={info.name} style={{ maxWidth: "100px", maxHeight: "200px" }} />
                  <Title order={4}>{info.name}</Title>
                  <p>{info.ingredients}</p>
                  <p><strong>Category:</strong> {info.category}</p>
                  {Object.keys(info.nutritionalInfo).length > 0 ? (
                    <div>
                      <Title order={5}>Nutritional Information</Title>
                      <ul>
                        {Object.entries(info.nutritionalInfo).map(([key, value]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p>No nutritional information available</p>
                  )}
                  <p><strong>Code:</strong> {code}</p>
                </div>
              ))}
            </div>
          ) : (
            <TextInput placeholder="No food information available" disabled />
          )}
        </> : <>h</>}
      </div>
    </MantineProvider>
  );
}

export default App;
