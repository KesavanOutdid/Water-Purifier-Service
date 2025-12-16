import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({Key? key}) : super(key: key);

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  late MobileScannerController controller;
  bool _hasScanned = false;

  @override
  void initState() {
    super.initState();
    controller = MobileScannerController(
      formats: [BarcodeFormat.qrCode],
      facing: CameraFacing.back,
      detectionSpeed: DetectionSpeed.normal,
    );
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              if (!_hasScanned && capture.barcodes.isNotEmpty) {
                final barcode = capture.barcodes.first;
                if (barcode.rawValue != null) {
                  _hasScanned = true;
                  Navigator.pop(context, barcode.rawValue);
                }
              }
            },
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            child: CustomPaint(
              painter: _ScannerOverlayPainter(),
            ),
          ),
          Positioned(
            bottom: 30,
            left: 0,
            right: 0,
            child: Center(
              child: Text(
                'Position QR code within the frame',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.white,
                      shadows: [
                        const Shadow(
                          color: Colors.black,
                          blurRadius: 4,
                        ),
                      ],
                    ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScannerOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.3)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;

    final width = size.width * 0.8;
    final height = size.height * 0.4;
    final left = (size.width - width) / 2;
    final top = (size.height - height) / 2;

    canvas.drawRect(
      Rect.fromLTWH(left, top, width, height),
      paint,
    );

    final cornerPaint = Paint()
      ..color = Colors.green
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;

    const cornerLength = 20.0;

    canvas.drawLine(Offset(left, top), Offset(left + cornerLength, top),
        cornerPaint);
    canvas.drawLine(Offset(left, top), Offset(left, top + cornerLength),
        cornerPaint);
    canvas.drawLine(
        Offset(left + width, top), Offset(left + width - cornerLength, top),
        cornerPaint);
    canvas.drawLine(Offset(left + width, top),
        Offset(left + width, top + cornerLength), cornerPaint);
    canvas.drawLine(
        Offset(left, top + height), Offset(left + cornerLength, top + height),
        cornerPaint);
    canvas.drawLine(Offset(left, top + height),
        Offset(left, top + height - cornerLength), cornerPaint);
    canvas.drawLine(Offset(left + width, top + height),
        Offset(left + width - cornerLength, top + height), cornerPaint);
    canvas.drawLine(Offset(left + width, top + height),
        Offset(left + width, top + height - cornerLength), cornerPaint);
  }

  @override
  bool shouldRepaint(_ScannerOverlayPainter oldDelegate) => false;
}
