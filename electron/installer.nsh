!macro customInstall
  ; Acceso directo al desinstalador dentro de la carpeta del programa
  CreateShortCut "$INSTDIR\Desinstalar Cap Finanzas.lnk" "$INSTDIR\Uninstall Cap Finanzas.exe" "" "$INSTDIR\Uninstall Cap Finanzas.exe" 0

  ; Acceso directo al desinstalador en el menú Inicio
  CreateDirectory "$SMPROGRAMS\Cap Finanzas"
  CreateShortCut "$SMPROGRAMS\Cap Finanzas\Desinstalar Cap Finanzas.lnk" "$INSTDIR\Uninstall Cap Finanzas.exe" "" "$INSTDIR\Uninstall Cap Finanzas.exe" 0
!macroend

!macro customUnInstall
  Delete "$INSTDIR\Desinstalar Cap Finanzas.lnk"
  Delete "$SMPROGRAMS\Cap Finanzas\Desinstalar Cap Finanzas.lnk"
  RMDir "$SMPROGRAMS\Cap Finanzas"
!macroend
