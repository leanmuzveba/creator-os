#!/usr/bin/env bash
# Build the Android APK and publish it as a GitHub Release, which installed
# apps pick up via their in-app update check (lib/services/update_checker.dart).
#
#   1. Bump `version:` in mobile/creator_os/pubspec.yaml (e.g. 1.0.1+2 -> 1.0.2+3)
#   2. Commit and push
#   3. scripts/release_mobile.sh "What changed in this version"
#
# The APK must be signed with the same key every time (currently the debug
# keystore on the release machine) or Android will refuse to update over it.
set -euo pipefail
cd "$(dirname "$0")/../mobile/creator_os"

full=$(grep -m1 '^version:' pubspec.yaml | awk '{print $2}' | tr -d '\r')
version=${full%%+*}
tag="mobile-v$version"
notes=${1:-"Creator OS $version"}

if gh release view "$tag" >/dev/null 2>&1; then
  echo "Release $tag already exists — bump the version in pubspec.yaml first." >&2
  exit 1
fi

flutter build apk --release \
  --dart-define=API_BASE_URL=https://creatoros-fnc0.onrender.com \
  --dart-define=APP_VERSION="$version"

apk="build/app/outputs/flutter-apk/CreatorOS-$version.apk"
cp build/app/outputs/flutter-apk/app-release.apk "$apk"
gh release create "$tag" "$apk" --title "Creator OS $version" --notes "$notes"
echo "Published $tag"
