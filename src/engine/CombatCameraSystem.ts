// ─── Combat Camera System (Vertex Offset & Screen Shake Engine) ───────────────

export interface CameraShakeConfig {
  maxOffset: number;
  maxRotation: number;
  decayRate: number;
  frequency: number;
}

export class CombatCameraSystem {
  private trauma: number = 0;
  private time: number = 0;
  private currentOffsetX: number = 0;
  private currentOffsetY: number = 0;
  private currentRotation: number = 0;

  private config: CameraShakeConfig = {
    maxOffset: 24, // max pixel displacement
    maxRotation: 0.05, // max radians
    decayRate: 1.4, // trauma decay per second
    frequency: 32.0 // oscillation speed
  };

  /**
   * Add trauma to the camera (0.0 to 1.0, clamped at 1.0)
   */
  public addTrauma(amount: number): void {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  /**
   * Trigger instant heavy shock (e.g. Extreme Crush)
   */
  public triggerCrushShock(): void {
    this.addTrauma(0.95);
  }

  /**
   * Trigger standard hit shock
   */
  public triggerHitShock(isCrit: boolean = false): void {
    this.addTrauma(isCrit ? 0.6 : 0.25);
  }

  /**
   * Update camera physics frame by frame
   * @param dt Delta time in seconds
   */
  public update(dt: number): void {
    this.time += dt;

    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - this.config.decayRate * dt);
      
      // Non-linear shake intensity: shake = trauma^2
      const shake = this.trauma * this.trauma;
      
      // Multi-harmonic oscillation to simulate natural rumble without external simplex noise dependency
      const t = this.time * this.config.frequency;
      const noiseX = Math.sin(t) * 0.6 + Math.sin(t * 1.7 + 1.2) * 0.4;
      const noiseY = Math.cos(t * 1.2) * 0.6 + Math.cos(t * 2.3 + 2.1) * 0.4;
      const noiseRot = Math.sin(t * 0.9 + 0.5) * 0.7 + Math.sin(t * 2.1) * 0.3;

      this.currentOffsetX = noiseX * this.config.maxOffset * shake;
      this.currentOffsetY = noiseY * this.config.maxOffset * shake;
      this.currentRotation = noiseRot * this.config.maxRotation * shake;
    } else {
      this.currentOffsetX = 0;
      this.currentOffsetY = 0;
      this.currentRotation = 0;
    }
  }

  /**
   * Get current 2D camera offset [x, y] in screen pixels
   * Passed directly to vertex shader uniform or 2D canvas transform
   */
  public getOffset(): [number, number] {
    return [this.currentOffsetX, this.currentOffsetY];
  }

  /**
   * Get current rotational shake in radians
   */
  public getRotation(): number {
    return this.currentRotation;
  }

  /**
   * Current trauma level (0 to 1)
   */
  public getTrauma(): number {
    return this.trauma;
  }

  /**
   * Reset shake immediately
   */
  public reset(): void {
    this.trauma = 0;
    this.currentOffsetX = 0;
    this.currentOffsetY = 0;
    this.currentRotation = 0;
  }
}
