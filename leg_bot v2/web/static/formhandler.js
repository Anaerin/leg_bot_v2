// You know, I don't think I actually need this.

function buildForm() {
	let formContents = {};

	// We're going to be working with both input elements and text areas. But the HTML DOM exposes
	// them as Node lists rather than arrays. So use this handy function (below) to convert a
	// node list into an array...
	let inputs = getArrayFromTagName("input");
	let textareas = getArrayFromTagName("textarea");
	let selects = getArrayFromTagName("select");

	textareas.forEach((textarea) => {
		// Unlike input fields, textareas don't have a "type" attribute. But setting one won't hurt.
		// So set one, so we can use a switch statement on the type attribute later.
		textarea.setAttribute("type", "textarea");
	});
	
	selects.forEach((select) => {
		// Same deal with selects.
		select.setAttribute("type", "select");
	});

	// Then join the two arrays together into one.
	let formFields = Array.prototype.concat(inputs, textareas, selects);
	formFields.forEach((element) => {

		// We're going to be working with form item names like "plugin.subitem.value" (hopefully).
		let elPath = [];
		if (element.name.includes(".")) {
			// If there's a . in the name, we've got a subitem style entry. Split it into an array:
			// ["plugin", "subitem", "value"];
			elPath = element.name.split(".");
		} else {
			// There's no . in the name. That makes this a root entry. But we're expecting arrays later. 
			// Best do something about that.
			elPath = [element.name];
		}
		
		// This is going to be tricky. I need to convert an array of items with a dotted name
		// into a tree of objects.
		// I'm using a map of maps, so I can invoke .set(). A regular object-pointer would get re-set
		// when I tried to assign the value.
		let pointer = formContents;
		while (elPath.length > 0) {
			let pos = elPath.shift();
			if (!pointer.hasOwnProperty(pos)) pointer[pos] = {};
		}
		let pos = elPath.shift();
		switch (element.attributes.getNamedItem("type")) {
			case "text":
			case "textarea":
			case "color":
			case "date":
			case "datetime-local":
			case "email":
			case "month":
			case "password":
			case "number":
			case "range":
			case "search":
			case "tel":
			case "time":
			case "url":
			case "week":
			case "hidden":
				pointer[pos] = element.value;
				break;
			case "checkbox":
				pointer[pos] = element.checked;
				break;
			case "radio":
				if (element.checked) pointer[pos] = element.value;
				break;
			case "select":
				pointer[pos] = element.options[element.selectedIndex].value;
				break;
		}
	});
	console.log(JSON.stringify(formContents));
}

function getArrayFromTagName(tagName) {
	return Array.prototype.slice.call(document.getElementsByTagName(tagName));
}