/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!***********************!*\
  !*** ./src/blocks.js ***!
  \***********************/
/*! exports provided: addAttribute, MyWithInspectorControl, addSaveProps */
/*! all exports used */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("Object.defineProperty(__webpack_exports__, \"__esModule\", { value: true });\n/* harmony export (immutable) */ __webpack_exports__[\"addAttribute\"] = addAttribute;\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"MyWithInspectorControl\", function() { return MyWithInspectorControl; });\n/* harmony export (immutable) */ __webpack_exports__[\"addSaveProps\"] = addSaveProps;\n/**\n * WordPress dependencies\n */\nvar _lodash = lodash,\n    assign = _lodash.assign;\nvar __ = wp.i18n.__;\nvar Fragment = wp.element.Fragment;\nvar addFilter = wp.hooks.addFilter;\nvar _wp$components = wp.components,\n    TextControl = _wp$components.TextControl,\n    PanelBody = _wp$components.PanelBody;\nvar hasBlockSupport = wp.blocks.hasBlockSupport;\nvar createHigherOrderComponent = wp.compose.createHigherOrderComponent;\nvar InspectorControls = wp.editor.InspectorControls;\n\n/**\n * Which block types supprt scheduling? This comes from PHP.\n */\n\nvar validBlockTypes = scheduledBlocksPHPData.valid_block_types;\n\n/**\n * Is the passed block name one which supports block scheduling?\n * The passed {name} is checked against the PHP var which sets out\n * which blocks are supported.\n *\n * @param {string} name The name of the block.\n */\nfunction isValidBlockType(name) {\n\n\treturn validBlockTypes.includes(name);\n} // end isValidBlockType()\n\n/**\n * Filters registered block settings, extending attributes with anchor using ID\n * of the first node.\n *\n * @param {Object} settings Original block settings.\n *\n * @return {Object} Filtered block settings.\n */\nfunction addAttribute(settings) {\n\n\t// If this block supports scheduling, add our custom attribute\n\tif (isValidBlockType(settings.name)) {\n\n\t\t// Use Lodash's assign to gracefully handle if attributes are undefined\n\t\tsettings.attributes = assign(settings.attributes, {\n\t\t\tscheduledStart: {\n\t\t\t\ttype: 'string'\n\t\t\t}\n\t\t});\n\t}\n\n\treturn settings;\n} // end addAttribute()\n\n/**\n * Override the default edit UI to include a new block inspector control for\n * assigning the anchor ID, if block supports anchor.\n *\n * @param {function|Component} BlockEdit Original component.\n *\n * @return {string} Wrapped component.\n */\nvar MyWithInspectorControl = createHigherOrderComponent(function (BlockEdit) {\n\n\treturn function (props) {\n\n\t\t// If this block supports scheduling and is currently selected, add our UI\n\t\tif (isValidBlockType(props.name) && props.isSelected) {\n\t\t\treturn wp.element.createElement(\n\t\t\t\tFragment,\n\t\t\t\tnull,\n\t\t\t\twp.element.createElement(BlockEdit, props),\n\t\t\t\twp.element.createElement(\n\t\t\t\t\tInspectorControls,\n\t\t\t\t\tnull,\n\t\t\t\t\twp.element.createElement(\n\t\t\t\t\t\tPanelBody,\n\t\t\t\t\t\t{ title: __('Block Scheduling') },\n\t\t\t\t\t\twp.element.createElement(TextControl, {\n\t\t\t\t\t\t\tlabel: __('Scheduled Start Date'),\n\t\t\t\t\t\t\thelp: __('When this block should be published.'),\n\t\t\t\t\t\t\tvalue: props.attributes.scheduledStart || '',\n\t\t\t\t\t\t\tonChange: function onChange(nextValue) {\n\t\t\t\t\t\t\t\tprops.setAttributes({\n\t\t\t\t\t\t\t\t\tscheduledStart: nextValue\n\t\t\t\t\t\t\t\t});\n\t\t\t\t\t\t\t} })\n\t\t\t\t\t)\n\t\t\t\t)\n\t\t\t);\n\t\t}\n\n\t\treturn wp.element.createElement(BlockEdit, props);\n\t};\n}, 'MyWithInspectorControl');\n\n/**\n * Override props assigned to save component to inject anchor ID, if block\n * supports anchor. This is only applied if the block's save result is an\n * element and not a markup string.\n *\n * @param {Object} extraProps Additional props applied to save element.\n * @param {Object} blockType  Block type.\n * @param {Object} attributes Current block attributes.\n *\n * @return {Object} Filtered props applied to save element.\n */\nfunction addSaveProps(extraProps, blockType, attributes) {\n\n\t// If the current block supports scheduling, add our prop.\n\tif (isValidBlockType(blockType.name)) {\n\t\textraProps.scheduledStart = attributes.scheduledStart;\n\t}\n\n\treturn extraProps;\n} // end addSaveProps()\n\naddFilter('blocks.registerBlockType', 'scheduled-blocks/add-attribute', addAttribute);\naddFilter('editor.BlockEdit', 'scheduled-blocks/with-inspector-control', MyWithInspectorControl);\naddFilter('blocks.getSaveContent.extraProps', 'scheduled-blocks/save-props', addSaveProps);//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiMC5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy8uL3NyYy9ibG9ja3MuanM/N2I1YiJdLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFdvcmRQcmVzcyBkZXBlbmRlbmNpZXNcbiAqL1xudmFyIF9sb2Rhc2ggPSBsb2Rhc2gsXG4gICAgYXNzaWduID0gX2xvZGFzaC5hc3NpZ247XG52YXIgX18gPSB3cC5pMThuLl9fO1xudmFyIEZyYWdtZW50ID0gd3AuZWxlbWVudC5GcmFnbWVudDtcbnZhciBhZGRGaWx0ZXIgPSB3cC5ob29rcy5hZGRGaWx0ZXI7XG52YXIgX3dwJGNvbXBvbmVudHMgPSB3cC5jb21wb25lbnRzLFxuICAgIFRleHRDb250cm9sID0gX3dwJGNvbXBvbmVudHMuVGV4dENvbnRyb2wsXG4gICAgUGFuZWxCb2R5ID0gX3dwJGNvbXBvbmVudHMuUGFuZWxCb2R5O1xudmFyIGhhc0Jsb2NrU3VwcG9ydCA9IHdwLmJsb2Nrcy5oYXNCbG9ja1N1cHBvcnQ7XG52YXIgY3JlYXRlSGlnaGVyT3JkZXJDb21wb25lbnQgPSB3cC5jb21wb3NlLmNyZWF0ZUhpZ2hlck9yZGVyQ29tcG9uZW50O1xudmFyIEluc3BlY3RvckNvbnRyb2xzID0gd3AuZWRpdG9yLkluc3BlY3RvckNvbnRyb2xzO1xuXG4vKipcbiAqIFdoaWNoIGJsb2NrIHR5cGVzIHN1cHBydCBzY2hlZHVsaW5nPyBUaGlzIGNvbWVzIGZyb20gUEhQLlxuICovXG5cbnZhciB2YWxpZEJsb2NrVHlwZXMgPSBzY2hlZHVsZWRCbG9ja3NQSFBEYXRhLnZhbGlkX2Jsb2NrX3R5cGVzO1xuXG4vKipcbiAqIElzIHRoZSBwYXNzZWQgYmxvY2sgbmFtZSBvbmUgd2hpY2ggc3VwcG9ydHMgYmxvY2sgc2NoZWR1bGluZz9cbiAqIFRoZSBwYXNzZWQge25hbWV9IGlzIGNoZWNrZWQgYWdhaW5zdCB0aGUgUEhQIHZhciB3aGljaCBzZXRzIG91dFxuICogd2hpY2ggYmxvY2tzIGFyZSBzdXBwb3J0ZWQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWUgVGhlIG5hbWUgb2YgdGhlIGJsb2NrLlxuICovXG5mdW5jdGlvbiBpc1ZhbGlkQmxvY2tUeXBlKG5hbWUpIHtcblxuXHRyZXR1cm4gdmFsaWRCbG9ja1R5cGVzLmluY2x1ZGVzKG5hbWUpO1xufSAvLyBlbmQgaXNWYWxpZEJsb2NrVHlwZSgpXG5cbi8qKlxuICogRmlsdGVycyByZWdpc3RlcmVkIGJsb2NrIHNldHRpbmdzLCBleHRlbmRpbmcgYXR0cmlidXRlcyB3aXRoIGFuY2hvciB1c2luZyBJRFxuICogb2YgdGhlIGZpcnN0IG5vZGUuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHNldHRpbmdzIE9yaWdpbmFsIGJsb2NrIHNldHRpbmdzLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gRmlsdGVyZWQgYmxvY2sgc2V0dGluZ3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRBdHRyaWJ1dGUoc2V0dGluZ3MpIHtcblxuXHQvLyBJZiB0aGlzIGJsb2NrIHN1cHBvcnRzIHNjaGVkdWxpbmcsIGFkZCBvdXIgY3VzdG9tIGF0dHJpYnV0ZVxuXHRpZiAoaXNWYWxpZEJsb2NrVHlwZShzZXR0aW5ncy5uYW1lKSkge1xuXG5cdFx0Ly8gVXNlIExvZGFzaCdzIGFzc2lnbiB0byBncmFjZWZ1bGx5IGhhbmRsZSBpZiBhdHRyaWJ1dGVzIGFyZSB1bmRlZmluZWRcblx0XHRzZXR0aW5ncy5hdHRyaWJ1dGVzID0gYXNzaWduKHNldHRpbmdzLmF0dHJpYnV0ZXMsIHtcblx0XHRcdHNjaGVkdWxlZFN0YXJ0OiB7XG5cdFx0XHRcdHR5cGU6ICdzdHJpbmcnXG5cdFx0XHR9XG5cdFx0fSk7XG5cdH1cblxuXHRyZXR1cm4gc2V0dGluZ3M7XG59IC8vIGVuZCBhZGRBdHRyaWJ1dGUoKVxuXG4vKipcbiAqIE92ZXJyaWRlIHRoZSBkZWZhdWx0IGVkaXQgVUkgdG8gaW5jbHVkZSBhIG5ldyBibG9jayBpbnNwZWN0b3IgY29udHJvbCBmb3JcbiAqIGFzc2lnbmluZyB0aGUgYW5jaG9yIElELCBpZiBibG9jayBzdXBwb3J0cyBhbmNob3IuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbnxDb21wb25lbnR9IEJsb2NrRWRpdCBPcmlnaW5hbCBjb21wb25lbnQuXG4gKlxuICogQHJldHVybiB7c3RyaW5nfSBXcmFwcGVkIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IHZhciBNeVdpdGhJbnNwZWN0b3JDb250cm9sID0gY3JlYXRlSGlnaGVyT3JkZXJDb21wb25lbnQoZnVuY3Rpb24gKEJsb2NrRWRpdCkge1xuXG5cdHJldHVybiBmdW5jdGlvbiAocHJvcHMpIHtcblxuXHRcdC8vIElmIHRoaXMgYmxvY2sgc3VwcG9ydHMgc2NoZWR1bGluZyBhbmQgaXMgY3VycmVudGx5IHNlbGVjdGVkLCBhZGQgb3VyIFVJXG5cdFx0aWYgKGlzVmFsaWRCbG9ja1R5cGUocHJvcHMubmFtZSkgJiYgcHJvcHMuaXNTZWxlY3RlZCkge1xuXHRcdFx0cmV0dXJuIHdwLmVsZW1lbnQuY3JlYXRlRWxlbWVudChcblx0XHRcdFx0RnJhZ21lbnQsXG5cdFx0XHRcdG51bGwsXG5cdFx0XHRcdHdwLmVsZW1lbnQuY3JlYXRlRWxlbWVudChCbG9ja0VkaXQsIHByb3BzKSxcblx0XHRcdFx0d3AuZWxlbWVudC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdEluc3BlY3RvckNvbnRyb2xzLFxuXHRcdFx0XHRcdG51bGwsXG5cdFx0XHRcdFx0d3AuZWxlbWVudC5jcmVhdGVFbGVtZW50KFxuXHRcdFx0XHRcdFx0UGFuZWxCb2R5LFxuXHRcdFx0XHRcdFx0eyB0aXRsZTogX18oJ0Jsb2NrIFNjaGVkdWxpbmcnKSB9LFxuXHRcdFx0XHRcdFx0d3AuZWxlbWVudC5jcmVhdGVFbGVtZW50KFRleHRDb250cm9sLCB7XG5cdFx0XHRcdFx0XHRcdGxhYmVsOiBfXygnU2NoZWR1bGVkIFN0YXJ0IERhdGUnKSxcblx0XHRcdFx0XHRcdFx0aGVscDogX18oJ1doZW4gdGhpcyBibG9jayBzaG91bGQgYmUgcHVibGlzaGVkLicpLFxuXHRcdFx0XHRcdFx0XHR2YWx1ZTogcHJvcHMuYXR0cmlidXRlcy5zY2hlZHVsZWRTdGFydCB8fCAnJyxcblx0XHRcdFx0XHRcdFx0b25DaGFuZ2U6IGZ1bmN0aW9uIG9uQ2hhbmdlKG5leHRWYWx1ZSkge1xuXHRcdFx0XHRcdFx0XHRcdHByb3BzLnNldEF0dHJpYnV0ZXMoe1xuXHRcdFx0XHRcdFx0XHRcdFx0c2NoZWR1bGVkU3RhcnQ6IG5leHRWYWx1ZVxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9IH0pXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQpXG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiB3cC5lbGVtZW50LmNyZWF0ZUVsZW1lbnQoQmxvY2tFZGl0LCBwcm9wcyk7XG5cdH07XG59LCAnTXlXaXRoSW5zcGVjdG9yQ29udHJvbCcpO1xuXG4vKipcbiAqIE92ZXJyaWRlIHByb3BzIGFzc2lnbmVkIHRvIHNhdmUgY29tcG9uZW50IHRvIGluamVjdCBhbmNob3IgSUQsIGlmIGJsb2NrXG4gKiBzdXBwb3J0cyBhbmNob3IuIFRoaXMgaXMgb25seSBhcHBsaWVkIGlmIHRoZSBibG9jaydzIHNhdmUgcmVzdWx0IGlzIGFuXG4gKiBlbGVtZW50IGFuZCBub3QgYSBtYXJrdXAgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBleHRyYVByb3BzIEFkZGl0aW9uYWwgcHJvcHMgYXBwbGllZCB0byBzYXZlIGVsZW1lbnQuXG4gKiBAcGFyYW0ge09iamVjdH0gYmxvY2tUeXBlICBCbG9jayB0eXBlLlxuICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMgQ3VycmVudCBibG9jayBhdHRyaWJ1dGVzLlxuICpcbiAqIEByZXR1cm4ge09iamVjdH0gRmlsdGVyZWQgcHJvcHMgYXBwbGllZCB0byBzYXZlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRTYXZlUHJvcHMoZXh0cmFQcm9wcywgYmxvY2tUeXBlLCBhdHRyaWJ1dGVzKSB7XG5cblx0Ly8gSWYgdGhlIGN1cnJlbnQgYmxvY2sgc3VwcG9ydHMgc2NoZWR1bGluZywgYWRkIG91ciBwcm9wLlxuXHRpZiAoaXNWYWxpZEJsb2NrVHlwZShibG9ja1R5cGUubmFtZSkpIHtcblx0XHRleHRyYVByb3BzLnNjaGVkdWxlZFN0YXJ0ID0gYXR0cmlidXRlcy5zY2hlZHVsZWRTdGFydDtcblx0fVxuXG5cdHJldHVybiBleHRyYVByb3BzO1xufSAvLyBlbmQgYWRkU2F2ZVByb3BzKClcblxuYWRkRmlsdGVyKCdibG9ja3MucmVnaXN0ZXJCbG9ja1R5cGUnLCAnc2NoZWR1bGVkLWJsb2Nrcy9hZGQtYXR0cmlidXRlJywgYWRkQXR0cmlidXRlKTtcbmFkZEZpbHRlcignZWRpdG9yLkJsb2NrRWRpdCcsICdzY2hlZHVsZWQtYmxvY2tzL3dpdGgtaW5zcGVjdG9yLWNvbnRyb2wnLCBNeVdpdGhJbnNwZWN0b3JDb250cm9sKTtcbmFkZEZpbHRlcignYmxvY2tzLmdldFNhdmVDb250ZW50LmV4dHJhUHJvcHMnLCAnc2NoZWR1bGVkLWJsb2Nrcy9zYXZlLXByb3BzJywgYWRkU2F2ZVByb3BzKTtcblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL3NyYy9ibG9ja3MuanNcbi8vIG1vZHVsZSBpZCA9IDBcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///0\n");

/***/ })
/******/ ]);