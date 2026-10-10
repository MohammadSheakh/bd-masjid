# ADR-046: Mobile Real-time Sensor-Fused Qibla Compass

## Status
Accepted

## Context
Muslim travelers and musallis across Bangladesh require accurate directional bearing towards the Kaaba in Mecca ($21.422487^\circ\text{N}, 39.826206^\circ\text{E}$) to establish valid prayer positioning when outside familiar mosques.

In Bangladesh ($20.5^\circ\text{N} - 26.6^\circ\text{N}, 88.0^\circ\text{E} - 92.7^\circ\text{E}$), the Great-Circle forward azimuth towards the Kaaba ranges between $276^\circ$ and $280^\circ$ (West-Northwest). Existing generic compass tools are often bloated with advertisements or require constant active network connections. The mobile client requires an instant, lightweight, offline-resilient Qibla compass adhering strictly to the Ferio Visual System (`#111114`, `#059669`, `#fafafa`).

## Decision
1. **Mathematical Great-Circle Forward Azimuth**:
   - Compute exact Qibla bearing using spherical trigonometry from user GPS coordinates:
     $$\Delta\lambda = \lambda_{\text{Kaaba}} - \lambda_{\text{user}}$$
     $$y = \sin(\Delta\lambda) \cdot \cos(\phi_{\text{Kaaba}})$$
     $$x = \cos(\phi_{\text{user}}) \cdot \sin(\phi_{\text{Kaaba}}) - \sin(\phi_{\text{user}}) \cdot \cos(\phi_{\text{Kaaba}}) \cdot \cos(\Delta\lambda)$$
     $$\text{Bearing} = (\operatorname{atan2}(y, x) \times \frac{180}{\pi} + 360) \pmod{360}$$
   - Default fallback coordinates: Dhaka city center ($23.8103^\circ\text{N}, 90.4125^\circ\text{E}$, bearing $277.8^\circ$).
2. **Sensor Layer & Fallback Architecture**:
   - Access device magnetometer/heading sensors with graceful simulated interactive calibration when running in emulators or devices without hardware compass chips.
   - Smooth rotational interpolation to eliminate high-frequency jitter.
3. **Ferio Visual Interface (`QiblaCompassModal.tsx`)**:
   - Circular monochrome compass dial with 360-degree tick marks and Cardinal markings (N, E, S, W).
   - Emerald Kaaba pointer (`#059669`) with Mecca distance calculation ($\approx 5,100\text{ km}$ from Bangladesh).
   - **Alignment Feedback**: When within $\pm 2^\circ$ of exact Kaaba direction, the dial transitions to vivid emerald `#059669` and displays *"Facing Kaaba (Qibla Aligned)"*.

## Consequences
- **Positive**: Complete offline capability; users can find Qibla anywhere in Bangladesh without mobile data.
- **Positive**: Clean Ferio aesthetics with zero ads or tracking.
- **Trade-off**: Devices without physical magnetometers rely on manual calibration or static bearing guidance.
