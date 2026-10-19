import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright

PROJECT_ROOT = Path("/Users/dayyoung/project/snshero")
IDS_FILE = PROJECT_ROOT / "scripts/youtube_animation_ids.json"

NEW_DESC = (
    "This video is the game story of SNSHero.\n\n"
    "Visit https://snshero.com for more details!"
)


async def update_one_video(sem, ctx, ep: str, video_id: str):
    async with sem:
        page = await ctx.new_page()
        try:
            url = f"https://studio.youtube.com/video/{video_id}/edit"
            await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            desc_box = page.locator("#description-textarea #textbox").first
            await desc_box.wait_for(state="visible", timeout=25000)
            for _ in range(30):
                txt = (await desc_box.inner_text()).strip()
                if len(txt) > 0:
                    break
                await asyncio.sleep(0.5)

            current_txt = (await desc_box.inner_text()).strip()
            if current_txt == NEW_DESC.strip():
                print(f"[EP {ep}] ({video_id}) Already updated, skipping.", flush=True)
                return True

            await desc_box.click()
            await page.keyboard.press("Meta+A")
            await page.keyboard.press("Backspace")
            await page.keyboard.insert_text(NEW_DESC)
            await asyncio.sleep(0.6)

            save_btn = page.locator("ytcp-button#save").first
            await save_btn.click()
            for _ in range(30):
                await asyncio.sleep(0.5)
                disabled = await save_btn.get_attribute("disabled")
                aria_disabled = await save_btn.get_attribute("aria-disabled")
                if disabled is not None or aria_disabled == "true":
                    print(f"[EP {ep}] ({video_id}) Description saved!", flush=True)
                    break
            await asyncio.sleep(0.5)
            return True
        except Exception as e:
            print(f"[EP {ep}] ({video_id}) Error: {e}", flush=True)
            return False
        finally:
            await page.close()


async def main():
    ids_map = json.loads(IDS_FILE.read_text(encoding="utf-8"))
    items = sorted(ids_map.items(), key=lambda kv: int(kv[0]))
    print(f"Updating descriptions for {len(items)} videos...", flush=True)

    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            user_data_dir="/tmp/yt_studio_chrome_profile2",
            channel="chrome",
            headless=True,
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            ignore_default_args=["--use-mock-keychain", "--password-store=basic"],
            args=["--profile-directory=Profile 2", "--disable-blink-features=AutomationControlled"],
            viewport={"width": 1440, "height": 900},
        )
        sem = asyncio.Semaphore(4)
        tasks = [update_one_video(sem, ctx, ep, vid) for ep, vid in items]
        results = await asyncio.gather(*tasks)
        await ctx.close()

    ok_count = sum(1 for r in results if r)
    print(f"Completed: {ok_count}/{len(items)} updated.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
