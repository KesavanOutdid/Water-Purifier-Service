# Docker container for building Flutter Android APK
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_HOME=/opt/android-sdk
ENV FLUTTER_HOME=/opt/flutter
ENV PATH=$PATH:$FLUTTER_HOME/bin:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools

# Install system dependencies & OpenJDK 17
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    openjdk-17-jdk-headless \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Android Command Line Tools
ARG ANDROID_CMD_TOOLS_VERSION=11076708
RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools && \
    curl -o /tmp/cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMD_TOOLS_VERSION}_latest.zip && \
    unzip /tmp/cmdline-tools.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools && \
    mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest && \
    rm /tmp/cmdline-tools.zip

# Accept licenses and install Android SDK components
RUN yes | sdkmanager --licenses && \
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Install Flutter SDK (Stable)
ARG FLUTTER_VERSION=3.29.0
RUN git clone -b ${FLUTTER_VERSION} https://github.com/flutter/flutter.git ${FLUTTER_HOME} && \
    flutter precache --android && \
    flutter doctor -v

WORKDIR /workspace

# Default command compiles the release APK
ENTRYPOINT ["/bin/bash", "-c", "flutter pub get && flutter build apk --release && cp build/app/outputs/flutter-apk/app-release.apk /workspace/output/ 2>/dev/null || true"]
