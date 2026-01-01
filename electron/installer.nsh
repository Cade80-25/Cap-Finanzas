!macro customInstall
  ; Acceso directo al desinstalador dentro de la carpeta del programa
  CreateShortCut "$INSTDIR\Desinstalar $^Name.lnk" "$INSTDIR\Uninstall $^Name.exe" "" "$INSTDIR\Uninstall $^Name.exe" 0

  ; Acceso directo al desinstalador en el menú Inicio
  CreateDirectory "$SMPROGRAMS\$^Name"
  CreateShortCut "$SMPROGRAMS\$^Name\Desinstalar $^Name.lnk" "$INSTDIR\Uninstall $^Name.exe" "" "$INSTDIR\Uninstall $^Name.exe" 0
!macroend

!macro customUnInstall
  Delete "$INSTDIR\Desinstalar $^Name.lnk"
  Delete "$SMPROGRAMS\$^Name\Desinstalar $^Name.lnk"
  RMDir "$SMPROGRAMS\$^Name"
!macroend
