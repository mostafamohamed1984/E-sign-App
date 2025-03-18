(() => {
  // ../esign_app/esign_app/public/js/timeline_button.js
  $(document).on("app_ready", function() {
    $.each(frappe.boot.user.can_read, function(i, doctype) {
      let buttonAdded = false;
      frappe.ui.form.on(doctype, {
        refresh: function(frm) {
          var _a, _b;
          if (!frm.is_new()) {
            if (((_b = (_a = frm.footer) == null ? void 0 : _a.frm) == null ? void 0 : _b.timeline) && !buttonAdded) {
              let send_esign = async () => {
                var _a2, _b2, _c;
                console.log("inside send button");
                let user = frappe.session.user;
                console.log("got user section", user);
                let userDetails = await frappe.db.get_value("User", user, [
                  "full_name",
                  "email"
                ]);
                console.log("got user details section", userDetails);
                let doctype2 = frm.doctype;
                console.log("got doctype ", doctype2);
                let docname = frm.docname;
                console.log("got docname ", docname);
                let fullName = ((_a2 = userDetails == null ? void 0 : userDetails.message) == null ? void 0 : _a2.full_name) || "Unknown User";
                let email = ((_b2 = userDetails == null ? void 0 : userDetails.message) == null ? void 0 : _b2.email) || "No Email";
                let templates = [];
                try {
                  let response = await fetch(
                    `/api/method/esign_app.api.get_templetes?user_mail=${email}`
                  );
                  let data = await response.json();
                  console.log("got response", data);
                  if (((_c = data.message) == null ? void 0 : _c.status) === 200 && Array.isArray(data.message.data)) {
                    templates = data.message.data.map((temp) => ({
                      label: temp.templete_title.trim(),
                      value: temp.name.trim()
                    }));
                  }
                } catch (error) {
                  console.error("Error fetching templates:", error);
                }
                console.log("Fetched Templates:", templates);
                let pdfUrl = `/api/method/frappe.utils.print_format.download_pdf?doctype=${doctype2}&name=${docname}&format=Standard&no_letterhead=1&letterhead=No%20Letterhead&settings=%7B%7D&_lang=en`;
                console.log("pdf url Loaded", pdfUrl);
                let pdfBase64 = "";
                try {
                  let response = await fetch(pdfUrl);
                  let blob = await response.blob();
                  let reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = function() {
                    pdfBase64 = reader.result.split(",")[1];
                    console.log("PDF Base64:", pdfBase64);
                  };
                } catch (error) {
                  console.error("Error fetching PDF:", error);
                }
                let templateOptions = {};
                if (templates.length) {
                  templateOptions = Object.fromEntries(templates.map((t) => [t.label, t.value]));
                }
                let dialog = new frappe.ui.Dialog({
                  title: "Send to eSign",
                  fields: [
                    {
                      fieldname: "user_details",
                      label: "User Details",
                      fieldtype: "HTML",
                      options: `<div style="
                              font-family: 'Arial', sans-serif;
                              font-size: 16px;
                              line-height: 1.6;
                              color: #333;
                              background: #f9f9f9;
                              padding: 15px 20px;
                              border: 1px solid #ddd;
                              border-radius: 10px;
                              max-width: 400px;
                              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                          ">
                              <p style="
                                  margin: 0 0 5px;
                                  font-weight: 600;
                                  font-size: 18px;
                                  color: #222;
                              ">
                                  ${fullName}
                              </p>
                              <p style="
                                  margin: 0;
                                  font-size: 14px;
                                  color: #555;
                              ">
                                  ${email}
                              </p>
                          </div>
                          </br>
                          `
                    },
                    {
                      fieldname: "custom_docname",
                      label: "Enter Name",
                      default: docname,
                      fieldtype: "Data",
                      reqd: 1
                    },
                    {
                      fieldname: "template_select",
                      label: "Select Template",
                      fieldtype: "Select",
                      options: Object.keys(templateOptions)
                    }
                  ],
                  primary_action_label: "Submit",
                  primary_action(values) {
                    let selectedLabel = values.template_select;
                    let selectedValue = templateOptions[selectedLabel] || null;
                    console.log("User Email:", email);
                    let response = frappe.call({
                      method: "esign_app.api.fetch_and_print_data",
                      args: {
                        custom_docname: values.custom_docname,
                        selectedValue,
                        pdfBase64,
                        email
                      }
                    });
                    dialog.hide();
                  }
                });
                dialog.show();
              };
              var timeline = frm.footer.frm.timeline;
              timeline.add_action_button(
                __("Send to Esign"),
                send_esign,
                "share",
                "btn-secondary send-raven-button"
              );
              buttonAdded = true;
            }
          }
        }
      });
    });
  });

  // ../esign_app/esign_app/public/js/esign.bundle.js
  $(document).on("app_ready", function() {
  });
})();
//# sourceMappingURL=esign.bundle.EBCZFBH3.js.map
