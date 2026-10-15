; MultiGridView installer for Windows.
; Installs for the current user only (no admin rights), adds Desktop and Start menu
; shortcuts for the grid and the alerts app, and registers an uninstaller under
; Settings > Apps. Built by .github/workflows/build-windows.yml.

Unicode true
!include "MUI2.nsh"

!ifndef VERSION
  !define VERSION "0.0.0"
!endif
!define APPNAME "MultiGridView"
!define EXE "MultiGridView.exe"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\MultiGridView"

Name "${APPNAME}"
OutFile "MultiGridView-Setup-${VERSION}.exe"
InstallDir "$LOCALAPPDATA\Programs\MultiGridView"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "${APPNAME} ${VERSION}"

VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "FileDescription" "${APPNAME} installer"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" " "

!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Install ${APPNAME} ${VERSION}"
!define MUI_WELCOMEPAGE_TEXT "This installs the ${APPNAME} grid and ${APPNAME} Alerts for your Windows account.$\r$\n$\r$\nIf ${APPNAME} is already installed it will be closed and updated. Your broadcaster lists, settings and sign-in are kept."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Open ${APPNAME}"
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Start ${APPNAME} Alerts"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION StartAlerts

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function StartAlerts
  Exec '"$INSTDIR\${EXE}" --alerts'
FunctionEnd

Section "Install"
  ; Close running copies (grid and alerts) so files can be replaced.
  nsExec::Exec 'taskkill /F /IM ${EXE}'
  Sleep 800

  ; Start from a clean program folder (settings live elsewhere, in AppData\Roaming).
  RMDir /r "$INSTDIR"
  SetOutPath "$INSTDIR"
  File /r "build\MultiGridView\*.*"
  File "icon.ico"

  SetShellVarContext current
  CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${EXE}" "" "$INSTDIR\${EXE}" 0
  CreateShortCut "$DESKTOP\${APPNAME} Alerts.lnk" "$INSTDIR\${EXE}" "--alerts" "$INSTDIR\${EXE}" 0
  CreateShortCut "$SMPROGRAMS\${APPNAME}.lnk" "$INSTDIR\${EXE}" "" "$INSTDIR\${EXE}" 0
  CreateShortCut "$SMPROGRAMS\${APPNAME} Alerts.lnk" "$INSTDIR\${EXE}" "--alerts" "$INSTDIR\${EXE}" 0

  WriteUninstaller "$INSTDIR\Uninstall.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "EstimatedSize" 300000
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM ${EXE}'
  Sleep 800
  SetShellVarContext current
  Delete "$DESKTOP\${APPNAME}.lnk"
  Delete "$DESKTOP\${APPNAME} Alerts.lnk"
  Delete "$SMPROGRAMS\${APPNAME}.lnk"
  Delete "$SMPROGRAMS\${APPNAME} Alerts.lnk"
  ; "Start with Windows" entries the alerts app may have added.
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.MultiGridView Alerts"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "electron.app.MultiGridView"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${UNINSTKEY}"
  MessageBox MB_YESNO|MB_ICONQUESTION "Also delete your MultiGridView settings (broadcaster lists, picture settings, alerts settings and sign-in)?" /SD IDNO IDNO keep
    RMDir /r "$APPDATA\MultiGridView"
    RMDir /r "$APPDATA\MultiGridView Alerts"
  keep:
SectionEnd
