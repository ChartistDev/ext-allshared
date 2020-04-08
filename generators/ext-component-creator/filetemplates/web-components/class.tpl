import {extendsclassname} from '{pathprefix}{extendpath}{classextendsfilename}';

export default class {classname} extends {extendsclassname} {
//events
{sEVENTGETSET}//configs
{sGETSET}
static XTYPE() {return '{xtype}'}
static PROPERTIESOBJECT() { return {
{sPROPERTIESOBJECT}}}
static EVENTS() { return [
{sEVENTS}]}
static METHODS() { return [
{sMETHODS}]}

    static get observedAttributes() {
        var attrs = super.observedAttributes
        for (var property in {classname}.PROPERTIESOBJECT()) {
            attrs.push(property)
        }
        {classname}.EVENTS().forEach(function (eventparameter, index, array) {
            attrs.push('on' + eventparameter.name)
        })
        return attrs
    }

    constructor() {
        super (
            {classname}.METHODS(),
            {classname}.XTYPE(),
            {classname}.PROPERTIESOBJECT(),
            {classname}.EVENTS()
        )
        this.XTYPE = {classname}.XTYPE()
        this.PROPERTIESOBJECT = this.extendObject(this.PROPERTIESOBJECT, {classname}.PROPERTIESOBJECT());
        this.METHODS = this.extendArray(this.METHODS, {classname}.METHODS());
        this.EVENTS = this.extendArray(this.EVENTS, {classname}.EVENTS());
    }

    connectedCallback() {
        super.connectedCallback()
    }

    attributeChangedCallback(attrName, oldVal, newVal) {
        super.attributeChangedCallback(attrName, oldVal, newVal)
    }

}
