'use client'
import { createElement, useEffect } from "react";

let imported = false;
async function lazyImport() {
    imported || import("@loudyo/elements");
}
function useLazyImport() {
    useEffect(() => void lazyImport());
}
function p(e) {
    return useLazyImport(), createElement("el-autocomplete", e);
}
function u(e) {
    return useLazyImport(), createElement("el-command-palette", e);
}
function i(e) {
    return useLazyImport(), createElement("el-command-list", e);
}
function a(e) {
    return useLazyImport(), createElement("el-defaults", e);
}
function c(e) {
    return useLazyImport(), createElement("el-no-results", e);
}
function m(e) {
    return useLazyImport(), createElement("el-command-group", e);
}
function E(e) {
    return useLazyImport(), createElement("el-command-preview", e);
}
function T(e) {
    return useLazyImport(), createElement("el-dialog", e);
}
function d(e) {
    return useLazyImport(), createElement("el-dialog-panel", e);
}
function L(e) {
    return useLazyImport(), createElement("el-dialog-backdrop", e);
}
function M(e) {
    return useLazyImport(), createElement("el-disclosure", e);
}
function H(e) {
    return useLazyImport(), createElement("el-select", e);
}
function f(e) {
    return useLazyImport(), createElement("el-selectedcontent", e);
}
function P(e) {
    return useLazyImport(), createElement("el-menu", e);
}
function v(e) {
    return useLazyImport(), createElement("el-dropdown", e);
}
function b(e) {
    return useLazyImport(), createElement("el-options", e);
}
function g(e) {
    return useLazyImport(), createElement("el-option", e);
}
function A(e) {
    return useLazyImport(), createElement("el-popover", e);
}
function B(e) {
    return useLazyImport(), createElement("el-popover-group", e);
}
function x(e) {
    return useLazyImport(), createElement("el-tab-list", e);
}
function h(e) {
    return useLazyImport(), createElement("el-tab-panels", e);
}
function C(e) {
    return useLazyImport(), createElement("el-tab-group", e);
}
function O(e) {
    return useLazyImport(), createElement("el-copyable", e);
}
export {
    p as ElAutocomplete,
    m as ElCommandGroup,
    i as ElCommandList,
    u as ElCommandPalette,
    E as ElCommandPreview,
    O as ElCopyable,
    a as ElDefaults,
    T as ElDialog,
    L as ElDialogBackdrop,
    d as ElDialogPanel,
    M as ElDisclosure,
    v as ElDropdown,
    P as ElMenu,
    c as ElNoResults,
    g as ElOption,
    b as ElOptions,
    A as ElPopover,
    B as ElPopoverGroup,
    H as ElSelect,
    f as ElSelectedcontent,
    C as ElTabGroup,
    x as ElTabList,
    h as ElTabPanels,
};
