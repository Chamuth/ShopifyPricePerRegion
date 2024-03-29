<!-- theme.css -->


.region-selector
{
  display:initial;
  top:0;
  left:0;
  z-index:2000;
  position:fixed;
  width:100%;
  height:100vh;
}

.region-selector .bg
{
  width:100%;
  height:100%;
  background-color:rgba(0,0,0,0.75);
}

.region-selector .content.type1 .type1
{
	display:initial;
}

.region-selector .content.type1 .type2
{
	display:none;
}

.region-selector .content.type2 .type1
{
	display:none;
}

.region-selector .content.type2 .type2
{
	display:initial;
}


.region-selector.hide
{
  display:none;
}

@keyframes slideUp
{
  0% { transform:translateX(-50%) translateY(100%); }
  100% { transform:translateX(-50%) translateY(0); } 
}

.region-selector .content 
{
  position:absolute;
  bottom:0;
  left:50%;
  transform:translateX(-50%);
  width: 400px;
  border-radius: 5px 5px 0 0;
  background-color:white;
  padding: 20px 25px;
  text-align:center;
  padding-top:70px;
  box-shadow: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
  animation:slideUp 250ms;
}

.region-selector .flag
{
  position:absolute;
  top:0;
  left:50%;
  transform:translateX(-50%) translateY(-50%);
  width:150px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
}

.region-selector .main
{
  font-size:1.30em;
  font-weight:bold;
  display:block;
  text-transform:uppercase;
  color:black;
  margin-bottom:5px;
}

.region-selector .sub
{
	display:block;
}

.region-selector .description 
{
	margin-top:15px;
}

.region-selector button
{
  display:block;
  margin-top:15px;
  width:100%;
}

.region-selector .change-region-link, .region-selector .skip-change-region
{
  display:block;
  margin-top:20px;
  margin-bottom:10px;
}

.region-selector select
{
  width:100%;
  padding: 10px 15px;
  display:block;
  margin-top:10px;
  margin-bottom:15px;
  border-radius:5px;
}

<!-- theme.liquid -->

<div class="region-selector hide">
    <div class="bg"></div>
    <div class="content type1">
      <img id="region-selector-flag" src="https://www.beautybay.com/assets/core/images/flags/lk.png" class="flag" />
      <div class="type1">
        <span class="main">We are shipping to Sri Lanka</span>
        <span class="sub">Prices are shown and changed to <strong>USD</strong>.</span>

        <p class="description">We use <a href="#">cookies</a> to ensure you have the best experience.</p>

        <button class="btn" id="regionContinueShoppingBtn">Continue Shopping</button>

        <a href="#" class="change-region-link">Not shipping to Sri Lanka?</a>
      </div>
      <div class="type2">
        <span class="main">Please select your currency</span>
        <span class="sub">Select your currency to start shopping</span>
        
        {% form 'currency' %}
          {{ form | currency_selector }}
          <button type="submit" class="btn">Update</button>
        {% endform %}
        
        <a href="#" class="skip-change-region">Continue shopping in Sri Lanka</a>
      </div>
    </div>
  </div>


<!-- theme.js -->

function currencyForCountry(code, code2) 
{
  var pounds = ["GBR"]
  var euro = ["IRL", "DEU", "ITA", "FRA", "ESP", "PRT", "NLD", "GRC", "AUT", "BEL", "FIN"];
  
  if (pounds.includes(code) || pounds.includes(code2))
    return "GBP";
  if (euro.includes(code) || euro.includes(code2))
    return "EUR";
  else return "USD";
}

function currencyFormSubmit(event) {
  event.target.form.submit();
}

document.querySelectorAll('.shopify-currency-form select').forEach(function(element) {
  element.addEventListener('change', currencyFormSubmit);
});

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

var regionModal = document.querySelector(".region-selector");

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

var geojs = JSON.parse(httpGet("https://get.geojs.io/v1/ip/country.json"));

document.getElementById("region-selector-flag").setAttribute("src", `https://flagcdn.com/w320/${geojs.country.toLowerCase()}.png`);
document.querySelector(".region-selector .content .main").innerHTML = "We are shipping to " + geojs.name;
document.querySelector(".region-selector .content .change-region-link").innerHTML = "Not shipping to " + geojs.name + "?";

var selectedCurrency = currencyForCountry(geojs.country, geojs.country_3);

document.querySelector(".region-selector .skip-change-region").innerHTML = "Continue shopping in " + selectedCurrency;


if (getCookie("region") == "") {
  // show the region modal 
  regionModal.classList.remove("hide");
  // set region cookie
  setCookie("region", selectedCurrency, 900)
}

document.querySelector(".region-selector .content .sub").innerHTML = "Prices are shown and changed to <strong>" + selectedCurrency + "</strong>.";

function hideRegionModal() {
 regionModal.classList.add("hide");
}
document.getElementById("regionContinueShoppingBtn").onclick = hideRegionModal;
document.querySelector(".region-selector .bg").onclick = hideRegionModal;
document.querySelector(".region-selector .skip-change-region").onclick = hideRegionModal;

document.querySelector(".region-selector .change-region-link").onclick = () => {
  var ct = document.querySelector(".region-selector .content");
  ct.classList.remove("type1");
  ct.classList.add("type2");
}

// Product_template
{% unless product.has_only_default_variant %}
  <div class="product-form__controls-group">
    {% for option in product.options_with_values %}
      {% unless option.name == "pprCurrency" or option.values.size == 1 %}
      <div class="selector-wrapper js product-form__item">
        <label for="SingleOptionSelector-{{ forloop.index0 }}">
          {{ option.name }}
        </label>
        <select class="single-option-selector single-option-selector-{{ section.id }} product-form__input"
          id="SingleOptionSelector-{{ forloop.index0 }}"
          data-index="option{{ forloop.index }}"
        >
          {% for value in option.values %}
            <option value="{{ value | escape }}"{% if option.selected_value == value %} selected="selected"{% endif %}>{{ value }}</option>
          {% endfor %}
        </select>
      </div>
      {% endunless %}
    {% endfor %}
  </div>
{% endunless %}