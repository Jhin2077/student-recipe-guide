import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import {
  CaretDown,
  CheckCircle,
  Clock,
  Coins,
  CookingPot,
  ForkKnife,
  Gauge,
  GlobeHemisphereWest,
  ImageSquare,
  MouseScroll,
  Shuffle,
  Sparkle,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import CardSwap, { Card } from "./CardSwap.jsx";
import { getRegionRecipes, regions, starterRecipes } from "./recipeData.js";

const emptyUpload = (region = "AU") => ({
  title: "",
  english: "",
  region,
  time: "25 min",
  cost: "",
  ingredients: "",
  steps: "",
  imageFile: null,
});

const recipeImageForRegion = (regionId) =>
  starterRecipes.find((recipe) => recipe.region === regionId)?.image;

function UploadModal({ initialRegion, onClose, onSubmit }) {
  const [form, setForm] = useState(() => emptyUpload(initialRegion));
  const [submitted, setSubmitted] = useState(false);
  const [preview, setPreview] = useState(null);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleFile = (event) => {
    const file = event.target.files?.[0] ?? null;
    update("imageFile", file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const ingredients = form.ingredients
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, amount = "适量"] = line.split(/[，,]/);
        return [name.trim(), amount.trim(), "自制配方"];
      });
    const steps = form.steps
      .split("\n")
      .map((line) => line.replace(/^\d+[.、]\s*/, "").trim())
      .filter(Boolean);

    onSubmit({
      id: `custom-${Date.now()}`,
      title: form.title,
      english: form.english || "My Own Recipe",
      region: form.region,
      category: "HOMEMADE",
      time: form.time,
      cost: form.cost || "按当地价格",
      difficulty: "我的配方",
      servings: "1–2 人",
      image: preview || recipeImageForRegion(form.region),
      ingredients: ingredients.length ? ingredients : [["自选食材", "适量", "稍后补充"]],
      steps: steps.length ? steps : ["按照自己的节奏完成这道菜。"],
      tip: "这是你刚刚上传的自制菜谱，本次浏览期间会保留在卡堆中。",
    });
    setSubmitted(true);
    window.setTimeout(onClose, 900);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow"><Sparkle weight="fill" /> COMMUNITY RECIPE</span>
            <h2 id="upload-title">上传你的自制菜谱</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭上传窗口">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="success-state" role="status">
            <CheckCircle size={54} weight="fill" />
            <h3>已加入你的卡堆</h3>
            <p>现在就可以用滚轮把它抽出来。</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid two-columns">
              <label>
                菜名
                <input
                  required
                  value={form.title}
                  onChange={(event) => update("title", event.target.value)}
                  placeholder="例如：冰箱清空炒饭"
                />
              </label>
              <label>
                英文名（可选）
                <input
                  value={form.english}
                  onChange={(event) => update("english", event.target.value)}
                  placeholder="Fridge-cleanout Fried Rice"
                />
              </label>
            </div>
            <div className="form-grid three-columns">
              <label>
                地区
                <select value={form.region} onChange={(event) => update("region", event.target.value)}>
                  {regions.map((region) => (
                    <option value={region.id} key={region.id}>{region.label}</option>
                  ))}
                </select>
              </label>
              <label>
                用时
                <input value={form.time} onChange={(event) => update("time", event.target.value)} />
              </label>
              <label>
                预算
                <input value={form.cost} onChange={(event) => update("cost", event.target.value)} placeholder="约 A$8" />
              </label>
            </div>
            <div className="form-grid two-columns textareas">
              <label>
                食材（每行一种，逗号后写用量）
                <textarea
                  required
                  rows="5"
                  value={form.ingredients}
                  onChange={(event) => update("ingredients", event.target.value)}
                  placeholder={"鸡蛋，2 个\n隔夜米饭，1 碗\n冷冻杂菜，1 杯"}
                />
              </label>
              <label>
                做法（每行一步）
                <textarea
                  required
                  rows="5"
                  value={form.steps}
                  onChange={(event) => update("steps", event.target.value)}
                  placeholder={"1. 先把鸡蛋炒散\n2. 加米饭和杂菜\n3. 大火炒香调味"}
                />
              </label>
            </div>
            <label className="image-upload">
              {preview ? <img src={preview} alt="菜谱封面预览" /> : <ImageSquare size={24} />}
              <span>{form.imageFile ? form.imageFile.name : "添加一道菜的照片（可选）"}</span>
              <input type="file" accept="image/*" onChange={handleFile} />
            </label>
            <div className="modal-actions">
              <button className="button ghost" type="button" onClick={onClose}>暂不上传</button>
              <button className="button primary" type="submit"><UploadSimple size={18} /> 加入卡堆</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function RecipeDetails({ recipe, index, total, regionLabel, isVisible = true }) {
  return (
    <section
      className={`recipe-details ${isVisible ? "is-visible" : "is-fading-out"}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(5px)",
      }}
      aria-live="polite"
    >
      <div className="recipe-kicker">
        <span>No. {String(index + 1).padStart(2, "0")}</span>
        <span>{regionLabel}</span>
        <span>{recipe.category}</span>
      </div>

      <div className="recipe-title-block">
        <h1>{recipe.title}</h1>
        <p>{recipe.english}</p>
      </div>

      <div className="quick-facts" aria-label="菜谱信息">
        <div><Clock size={18} /><span>用时</span><strong>{recipe.time}</strong></div>
        <div><Coins size={18} /><span>预算</span><strong>{recipe.cost}</strong></div>
        <div><Gauge size={18} /><span>难度</span><strong>{recipe.difficulty}</strong></div>
      </div>

      <div className="recipe-columns">
        <div className="ingredients-panel">
          <div className="section-heading">
            <span>01</span>
            <h2>食材配比</h2>
            <small>{recipe.servings}</small>
          </div>
          <ul className="ingredient-list">
            {recipe.ingredients.map(([name, amount, note]) => (
              <li key={`${recipe.id}-${name}`}>
                <span><strong>{name}</strong><small>{note}</small></span>
                <b>{amount}</b>
              </li>
            ))}
          </ul>
        </div>

        <div className="method-panel">
          <div className="section-heading">
            <span>02</span>
            <h2>开火做饭</h2>
            <small>{recipe.steps.length} 步</small>
          </div>
          <ol className="method-list">
            {recipe.steps.map((step, stepIndex) => (
              <li key={`${recipe.id}-step-${stepIndex}`}>
                <span>{String(stepIndex + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="survival-tip">
        <Sparkle size={16} weight="fill" />
        <span><b>留子生存提示</b>{recipe.tip}</span>
      </div>

      <div className="details-footer">
        <span>{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
        <div className="progress-track"><i style={{ width: `${((index + 1) / total) * 100}%` }} /></div>
      </div>
    </section>
  );
}

function RecipeDetailsTransition(props) {
  const [renderedProps, setRenderedProps] = useState(props);
  const [isVisible, setIsVisible] = useState(true);
  const latestProps = useRef(props);
  const revealTimer = useRef(null);
  latestProps.current = props;

  useEffect(() => {
    if (props.recipe.id === renderedProps.recipe.id) {
      setRenderedProps(props);
      return undefined;
    }

    setIsVisible(false);
    const swapTimer = window.setTimeout(() => {
      setRenderedProps(latestProps.current);
      revealTimer.current = window.setTimeout(() => setIsVisible(true), 34);
    }, 220);

    return () => {
      window.clearTimeout(swapTimer);
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
    };
  }, [props.recipe.id]);

  return <RecipeDetails {...renderedProps} isVisible={isVisible} />;
}

const MenuCard = forwardRef(function MenuCard({ recipe, index, ...cardProps }, ref) {
  return (
    <Card
      ref={ref}
      {...cardProps}
      className={`dish-card ${cardProps.className ?? ""}`.trim()}
      aria-label={`${recipe.title} 菜谱卡片`}
    >
      <div className="card-topline">
        <span>No. {String(index + 1).padStart(2, "0")}</span>
        <span>{recipe.category}</span>
      </div>
      <div className="card-title-row">
        <div>
          <h3>{recipe.title}</h3>
          <p>{recipe.english}</p>
        </div>
        <ForkKnife size={22} />
      </div>
      <div className="dish-image-wrap">
        <img src={recipe.image} alt={recipe.title} />
        <span>{recipe.time}</span>
      </div>
      <div className="card-bottom">
        <div><small>EST. COST</small><strong>{recipe.cost}</strong></div>
        <div><small>LEVEL</small><strong>{recipe.difficulty}</strong></div>
      </div>
    </Card>
  );
});

export function App() {
  const [recipes, setRecipes] = useState(starterRecipes);
  const [regionId, setRegionId] = useState("AU");
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const deckRef = useRef(null);
  const wheelLock = useRef(false);

  const regionRecipes = useMemo(
    () => getRegionRecipes(recipes, regionId),
    [recipes, regionId],
  );
  const activeRecipe = regionRecipes[activeIndex] ?? regionRecipes[0];
  const activeRegion = regions.find((region) => region.id === regionId) ?? regions[0];

  const changeRegion = (nextRegion) => {
    setRegionId(nextRegion);
    setActiveIndex(0);
  };

  const handleWheel = (event) => {
    if (showUpload || Math.abs(event.deltaY) < 18 || wheelLock.current) return;
    wheelLock.current = true;
    if (event.deltaY > 0) deckRef.current?.next();
    else deckRef.current?.previous();
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 760);
  };

  const drawRandom = () => {
    if (regionRecipes.length < 2) return;
    let target = activeIndex;
    while (target === activeIndex) target = Math.floor(Math.random() * regionRecipes.length);
    setActiveIndex(target);
    deckRef.current?.goTo(target);
  };

  const addRecipe = (recipe) => {
    setRecipes((current) => [recipe, ...current]);
    setRegionId(recipe.region);
    setActiveIndex(0);
  };

  if (!activeRecipe) return null;

  return (
    <main className="app-shell" onWheel={handleWheel}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="留学生食谱生存指南首页">
          <span className="brand-mark"><CookingPot size={23} weight="fill" /></span>
          <span><strong>留学生食谱</strong><small>SURVIVAL KITCHEN GUIDE</small></span>
        </a>

        <nav className="top-actions" aria-label="主要操作">
          <label className="region-select">
            <GlobeHemisphereWest size={18} />
            <span className="sr-only">选择地区</span>
            <select value={regionId} onChange={(event) => changeRegion(event.target.value)}>
              {regions.map((region) => (
                <option value={region.id} key={region.id}>{region.label}</option>
              ))}
            </select>
            <CaretDown size={14} />
          </label>
          <button className="button ghost upload-button" type="button" onClick={() => setShowUpload(true)}>
            <UploadSimple size={18} /> 上传自制菜谱
          </button>
          <button className="button primary random-button" type="button" onClick={drawRandom}>
            <Shuffle size={18} weight="bold" /> 随机抽卡
          </button>
        </nav>
      </header>

      <div className="workspace" id="top">
        <RecipeDetailsTransition
          recipe={activeRecipe}
          index={activeIndex}
          total={regionRecipes.length}
          regionLabel={activeRegion.label}
        />

        <section className="deck-stage" aria-label={`${activeRegion.label} 菜谱卡堆`}>
          <div className="deck-caption">
            <span>LOCAL PICKS / {activeRegion.short}</span>
            <small>滚轮切换 · 悬停暂停自动播放</small>
          </div>
          <CardSwap
            key={`${regionId}-${regionRecipes.length}`}
            ref={deckRef}
            width={480}
            height={540}
            cardDistance={50}
            verticalDistance={75}
            delay={5500}
            pauseOnHover
            skewAmount={9}
            onActiveChange={setActiveIndex}
          >
            {regionRecipes.map((recipe, index) => (
              <MenuCard recipe={recipe} index={index} key={recipe.id} />
            ))}
          </CardSwap>
          <div className="scroll-cue" aria-hidden="true">
            <MouseScroll size={19} />
            <span>SCROLL TO SWAP</span>
          </div>
        </section>
      </div>

      <footer className="app-footer">
        <span>参数：50 / 75 / 5500 / 9 / ELASTIC</span>
        <span>先吃好，再写论文。</span>
      </footer>

      {showUpload && (
        <UploadModal
          initialRegion={regionId}
          onClose={() => setShowUpload(false)}
          onSubmit={addRecipe}
        />
      )}
    </main>
  );
}
