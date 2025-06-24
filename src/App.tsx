import {
  Burger,
  Button,
  Center,
  Flex,
  Image,
  MantineProvider,
  NavLink,
  Space,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import "./App.css";
import "@mantine/core/styles.css";
import { FaHome } from "react-icons/fa";
import { BiFoodMenu } from "react-icons/bi";
import { useState } from "react";
import { CiForkAndKnife } from "react-icons/ci";

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

  function resetAllStorage() {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(";").forEach((cookie) => {
      const cookieName = cookie.split("=")[0].trim();
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
    log("All storage cleared");
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
      const response = await fetch(
        `https://world.openfoodfacts.net/api/v2/product/${barcode}.json`
      );
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
    let foundFood = null;
    setFoodInfo({});
    if (!name.match(/^[a-zA-Z\s]+$/) && name.match(/^\d+$/)) {
      log(`Searching food by barcode: ${name}`);
      const data = await getFoodInfo(name);
      if (data && data.product) {
        const foodObj = {
          name: data.product.product_name,
          ingredients: data.product.ingredients_text || "No ingredients listed",
          nutritionalInfo: data.product.nutriments || "No nutritional information available",
          code: data.product.code,
          category: data.product.categories_tags ? data.product.categories_tags.join(", ") : "No category",
          image: data.product.image_url || "No image available",
        };
        setFoodInfo((prev: any) => ({ ...prev, [data.product.code]: foodObj }));
        log(`Product: ${data.product.product_name}, Code: ${data.product.code}`);
        foundFood = foodObj;
      } else {
        log(`No product found for barcode: ${name}`, "warn");
        alert(`No product found for barcode: ${name}`);
      }
    } else {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${name}&search_simple=1&json=1&page_size=10`
      );
      const data = await response.json();
      log("Food search completed successfully");
      if (data.products && data.products.length > 0) {
        log(`Found ${data.products.length} products for \"${name}\"`);
        data.products.forEach((product: any) => {
          setFoodInfo((prev: any) => ({
            ...prev,
            [product.code]: {
              name: product.product_name,
              ingredients: product.ingredients_text || "No ingredients listed",
              nutritionalInfo: product.nutriments || "No nutritional information available",
              code: product.code,
              category: product.categories_tags ? product.categories_tags.join(", ") : "No category",
              image: product.image_url || "No image available",
            },
          }));
          log(`Product: ${product.product_name}, Code: ${product.code}`);
        });
        // Return the first product
        const first = data.products[0];
        foundFood = {
          name: first.product_name,
          ingredients: first.ingredients_text || "No ingredients listed",
          nutritionalInfo: first.nutriments || "No nutritional information available",
          code: first.code,
          category: first.categories_tags ? first.categories_tags.join(", ") : "No category",
          image: first.image_url || "No image available",
        };
      } else {
        log(`No products found for \"${name}\"`, "warn");
        alert(`No products found for \"${name}\"`);
      }
    }
    return foundFood;
  }

  const [currentFoodSearch, setCurrentFoodSearch] = useState("");
  const [foodInfo, setFoodInfo] = useState({});
  const [foodLog, setFoodLog] = useState(getFromStorage("foodLog") || []);
  const [isLoading, setIsLoading] = useState(false);

  async function logfood() {
    if (!currentFoodSearch) {
      log("No food search input provided", "warn");
      return;
    }
    setIsLoading(true);
    const foodItem = await searchFoodByName(currentFoodSearch);
    setIsLoading(false);
    if (foodItem && Object.keys(foodItem).length > 0) {
      const logEntry = `${foodItem.name} (${foodItem.code}) - ${foodItem.ingredients}`;
      setFoodLog((prevLog: any) => {
        const updatedLog = [...prevLog, logEntry];
        saveToStorage("foodLog", updatedLog);
        return updatedLog;
      });
      log(`Food logged: ${logEntry}`);
      setCurrentFoodSearch(""); // Clear input after logging
    } else {
      log("No food data available to log", "warn");
    }
  }

  return (
    <MantineProvider>
      <div className="nav">
        <Button
          className="reset-button"
          onClick={() => {
            resetAllStorage();
            setFoodLog([]);
            setFoodInfo({});
            setCurrentFoodSearch("");
          }}
        >
          Reset All Storage
        </Button>
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
          style={{
            fontWeight:
              window.location.href.split("/")[3] == "" ? "700" : "inherit",
          }}
        />
        <NavLink
          label="Food Search"
          className="navlink"
          href="?p=food-search"
          leftSection={<BiFoodMenu className="nlicon" size={16} />}
          style={{
            fontWeight:
              window.location.href.split("?p=")[1] == "food-search"
                ? "700"
                : "inherit",
          }}
        />
        <NavLink
          label="Log Food"
          className="navlink"
          href="?p=add-food"
          leftSection={<CiForkAndKnife className="nlicon" size={16} />}
          style={{
            fontWeight:
              window.location.href.split("?p=")[1] == "add-food"
                ? "700"
                : "inherit",
          }}
        />
      </div>
      <div className="content">
        {window.location.href.split("?p=")[1] == "food-search" ? (
          <>
            {/* Display food search page content here */}
            <Title order={3} className="content-title">
              Food Search
            </Title>
            <TextInput
              value={currentFoodSearch}
              onChange={(e) => setCurrentFoodSearch(e.target.value)}
              placeholder="Search for food by name or barcode"
            />
            <button onClick={() => searchFoodByName(currentFoodSearch)}>
              Search
            </button>
            <Space h="md" />
            {Object.keys(foodInfo).length > 0 ? (
              <div className="food-info">
                {Object.entries(foodInfo).map(([code, info]) => {
                  const typedInfo = info as {
                    name: string;
                    ingredients: string;
                    nutritionalInfo: Record<string, any>;
                    code: string;
                    category: string;
                    image: string;
                  };

                  return (
                    <div key={code} className="food-item">
                      <Image
                        src={typedInfo.image}
                        alt={typedInfo.name}
                        style={{ maxWidth: "100px", maxHeight: "200px" }}
                      />
                      <Title order={4}>{typedInfo.name}</Title>
                      <p>{typedInfo.ingredients}</p>
                      <p>
                        <strong>Category:</strong> {typedInfo.category}
                      </p>
                      {typedInfo.nutritionalInfo &&
                      Object.keys(typedInfo.nutritionalInfo).length > 0 ? (
                        <div>
                          <Title order={5}>Nutritional Information</Title>
                          <ul>
                            {Object.entries(typedInfo.nutritionalInfo).map(
                              ([key, value]) => (
                                <li key={key}>
                                  <strong>{key}:</strong> {value}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      ) : (
                        <p>No nutritional information available</p>
                      )}
                      <p>
                        <strong>Code:</strong> {code}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <TextInput placeholder="No food information available" disabled />
            )}
          </>
        ) : window.location.href.split("?p=")[1] == "add-food" ? (
          <>
            <Title order={3} className="content-title">
              Log Food
            </Title>
            <Flex direction="column" gap="md">
              <TextInput
                value={currentFoodSearch}
                onChange={(e) => setCurrentFoodSearch(e.target.value)}
                placeholder="Log food by name or barcode"
              />
              <Button onClick={logfood} disabled={isLoading}>
                {isLoading ? "Fetching Data..." : "Log Food"}
              </Button>
            </Flex>
            <Space h="md" />
            <Text>
              {foodLog.length > 0 ? (
                <ul>
                  {foodLog.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              ) : (
                "No food logged yet."
              )}
            </Text>
          </>
        ) : (
          <>
            {/* Display dashboard content here */}
            <Title order={3} className="content-title">
              Dashboard
            </Title>
            <TextInput
              placeholder="This feature is under development"
              disabled
            />
          </>
        )}
      </div>
    </MantineProvider>
  );
}

export default App;
