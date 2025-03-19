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
                let templateOptions = {};
                if (templates.length) {
                  templateOptions = Object.fromEntries(templates.map((t) => [t.label, t.value]));
                }
                console.log("*************************", Object.keys(templateOptions));
                let dialog = new frappe.ui.Dialog({
                  title: "Send to eSign test",
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
                      fieldname: "letterhead",
                      label: "Select Letter Head",
                      fieldtype: "Link",
                      options: "Letter Head"
                    },
                    {
                      fieldname: "print_format",
                      label: "Select Print Format",
                      fieldtype: "Link",
                      options: "Print Format",
                      get_query: function() {
                        return {
                          filters: {
                            "doc_type": cur_frm.doc.doctype
                          }
                        };
                      }
                    },
                    {
                      fieldname: "template_select",
                      label: "Select Template",
                      fieldtype: "Link",
                      options: "TempleteList",
                      get_query() {
                        return {
                          filters: {
                            name: ["in", Object.values(templateOptions)]
                          }
                        };
                      }
                    }
                  ],
                  primary_action_label: "Submit",
                  primary_action: async (values) => {
                    frappe.show_alert({ message: "Processing...", indicator: "orange" });
                    console.log("LLLLLKKLKLKL", values.print_format, values.letterhead);
                    function getPDFUrl() {
                      let doctype3 = cur_frm.doc.doctype;
                      let docname2 = cur_frm.doc.name;
                      let printFormat = values.print_format || "Standard";
                      let letterhead = values.letterhead || "No Letterhead";
                      let noLetterhead = letterhead === "No Letterhead" ? 1 : 0;
                      let pdfUrl2 = `/api/method/frappe.utils.print_format.download_pdf?doctype=${doctype3}&name=${docname2}&format=${printFormat}&no_letterhead=${noLetterhead}&letterhead=${encodeURIComponent(letterhead)}&settings=%7B%7D&_lang=en`;
                      return pdfUrl2;
                    }
                    let pdfUrl = getPDFUrl();
                    console.log(pdfUrl);
                    console.log("PDF URL Loaded:", pdfUrl);
                    async function fetchPdfBase64(url) {
                      try {
                        let response = await fetch(url);
                        let blob = await response.blob();
                        return new Promise((resolve, reject) => {
                          let reader = new FileReader();
                          reader.readAsDataURL(blob);
                          reader.onloadend = () => resolve(reader.result.split(",")[1]);
                          reader.onerror = (error) => reject(error);
                        });
                      } catch (error) {
                        console.error("Error fetching PDF:", error);
                        return null;
                      }
                    }
                    let pdfBase64 = await fetchPdfBase64(pdfUrl);
                    if (!pdfBase64) {
                      frappe.msgprint({
                        title: "Error",
                        message: "Failed to fetch and convert PDF!",
                        indicator: "red"
                      });
                      return;
                    }
                    console.log("PDF Base64:", pdfBase64);
                    let selectedLabel = values.template_select;
                    console.log("User Email:", email);
                    frappe.call({
                      method: "esign_app.api.fetch_and_print_data",
                      args: {
                        custom_docname: values.custom_docname,
                        selectedValue: selectedLabel,
                        pdfBase64,
                        email
                      },
                      callback: function(response) {
                        var _a3;
                        if (response.message && response.message.status === 200) {
                          frappe.hide_progress();
                          frappe.msgprint({
                            title: "Success",
                            message: "Document Created Successfully!",
                            indicator: "green"
                          });
                        } else {
                          frappe.msgprint({
                            title: "Error",
                            message: ((_a3 = response.message) == null ? void 0 : _a3.error) || "Something went wrong!",
                            indicator: "red"
                          });
                        }
                      },
                      error: function(error) {
                        frappe.hide_progress();
                        frappe.msgprint({
                          title: "Error",
                          message: "Failed to create the document!",
                          indicator: "red"
                        });
                        console.error("API Call Failed:", error);
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
//# sourceMappingURL=esign.bundle.4O23XSOD.js.map
