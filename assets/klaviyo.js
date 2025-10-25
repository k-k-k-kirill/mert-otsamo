const addFormSubmitListener = () => {
  const form = document.getElementById("klaviyo-custom-form");
  const messageDiv = document.getElementById("klaviyo-message");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    e.stopPropagation();

    const email = document.getElementById("klaviyo-email").value;

    // Clear previous messages
    messageDiv.textContent = "";
    messageDiv.className = "";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      messageDiv.textContent =
        "Please enter a valid email address (e.g., name@example.com).";
      messageDiv.className = "error show";
      return false;
    }

    // 🔑 Replace with your values
    const companyId = "SrvfkS";
    const listId = "WrY47b";

    fetch(
      `https://a.klaviyo.com/client/subscriptions?company_id=${companyId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.api+json",
          Accept: "application/vnd.api+json",
          revision: "2025-07-15",
        },
        body: JSON.stringify({
          data: {
            type: "subscription",
            attributes: {
              profile: {
                data: {
                  type: "profile",
                  attributes: {
                    email: email,
                    subscriptions: {
                      email: {
                        marketing: {
                          consent: "SUBSCRIBED",
                        },
                      },
                    },
                  },
                },
              },
            },
            relationships: {
              list: {
                data: {
                  type: "list",
                  id: listId,
                },
              },
            },
          },
        }),
      }
    )
      .then((res) => {
        if (res.status === 202) {
          // Replace the entire form with success message
          const formContainer = document.querySelector(
            ".klaviyo-custom-wrapper"
          );
          formContainer.innerHTML = `
            <div class="klaviyo-success-message">
              <p>Thank you for subscribing. We'll keep you updated!</p>
            </div>
          `;
        } else {
          return res.json().then((err) => {
            console.error("Klaviyo error:", err);
            messageDiv.textContent = "Subscription failed. Try again later.";
            messageDiv.className = "error show";
          });
        }
      })
      .catch((err) => {
        console.error("Network error:", err);
        messageDiv.textContent = "Network error. Try again later.";
        messageDiv.className = "error show";
      });
  });
};

const addInoutContainerAnimation = () => {
  const input = document.querySelector(".klaviyo-email-input");
  const underline = document.querySelector(".klaviyo-email-input-underline");

  input.addEventListener("focus", () => {
    underline.classList.add("active");
  });

  input.addEventListener("blur", () => {
    underline.classList.remove("active");
  });
};

document.addEventListener("DOMContentLoaded", function () {
  addFormSubmitListener();
  addInoutContainerAnimation();
});
