/**
 * cardGestureAdapter.ts
 * 2D 카드 배틀(/play) 드래그앤드롭 카드 배치 제스처 최적화 & 원터치 슬롯 탭 배치 지원
 * (구글 스프레드시트 Row 815 / ID 552 요구사항 구현)
 */

export interface CardSlotSnapTarget {
  index: number;
  rect: DOMRect;
  isOccupied: boolean;
}

export interface CardPlacementCallbacks {
  onCardSelected: (cardIndex: number) => void;
  onCardPlaced: (cardIndex: number, slotIndex: number) => void;
  onDragStart?: (cardIndex: number, startX: number, startY: number) => void;
  onDragMove?: (currentX: number, currentY: number, nearestSlot: number | null) => void;
  onDragEnd?: () => void;
}

export class CardGestureAdapter {
  private container: HTMLElement;
  private callbacks: CardPlacementCallbacks;
  private selectedCardIndex: number | null = null;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;
  private currentDragCardIdx: number | null = null;

  constructor(container: HTMLElement, callbacks: CardPlacementCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
  }

  /**
   * 1-Tap 카드 선택 핸들러 (원터치 선택 모드)
   */
  public handleCardTap(cardIndex: number): void {
    this.selectedCardIndex = cardIndex;
    this.callbacks.onCardSelected(cardIndex);
  }

  /**
   * 1-Tap 슬롯 배치 핸들러 (카드 선택 후 타일 탭으로 원터치 배치)
   */
  public handleSlotTap(slotIndex: number, isOccupied: boolean = false): boolean {
    if (isOccupied) return false;
    if (this.selectedCardIndex === null) return false;

    this.callbacks.onCardPlaced(this.selectedCardIndex, slotIndex);
    this.selectedCardIndex = null;
    return true;
  }

  /**
   * 드래그 스타트 (자석 스냅 드래그앤드롭)
   */
  public startDrag(cardIndex: number, clientX: number, clientY: number): void {
    this.isDragging = true;
    this.currentDragCardIdx = cardIndex;
    this.dragStartX = clientX;
    this.dragStartY = clientY;
    this.callbacks.onDragStart?.(cardIndex, clientX, clientY);
  }

  /**
   * 드래그 무브 & 가장 가까운 슬롯 탐색 (자석 스냅 효과)
   */
  public moveDrag(
    clientX: number,
    clientY: number,
    availableSlots: CardSlotSnapTarget[]
  ): number | null {
    if (!this.isDragging) return null;

    let nearestSlotIndex: number | null = null;
    let minDistance = 60; // 60px 이내 접근 시 자석 스냅

    for (const slot of availableSlots) {
      if (slot.isOccupied) continue;
      const slotCenterX = slot.rect.left + slot.rect.width / 2;
      const slotCenterY = slot.rect.top + slot.rect.height / 2;
      const dist = Math.hypot(clientX - slotCenterX, clientY - slotCenterY);

      if (dist < minDistance) {
        minDistance = dist;
        nearestSlotIndex = slot.index;
      }
    }

    this.callbacks.onDragMove?.(clientX, clientY, nearestSlotIndex);
    return nearestSlotIndex;
  }

  /**
   * 드래그 종료 & 최종 슬롯 안착 판정
   */
  public endDrag(
    clientX: number,
    clientY: number,
    availableSlots: CardSlotSnapTarget[]
  ): boolean {
    if (!this.isDragging || this.currentDragCardIdx === null) {
      this.isDragging = false;
      this.currentDragCardIdx = null;
      return false;
    }

    const targetSlot = this.moveDrag(clientX, clientY, availableSlots);
    this.callbacks.onDragEnd?.();

    if (targetSlot !== null) {
      this.callbacks.onCardPlaced(this.currentDragCardIdx, targetSlot);
      this.isDragging = false;
      this.currentDragCardIdx = null;
      this.selectedCardIndex = null;
      return true;
    }

    this.isDragging = false;
    this.currentDragCardIdx = null;
    return false;
  }

  public getSelectedCard(): number | null {
    return this.selectedCardIndex;
  }

  public clearSelection(): void {
    this.selectedCardIndex = null;
  }
}
