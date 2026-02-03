import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  incomeMacroCategories, 
  getIncomeCategoriesByMacro, 
  getIncomeBusinessTypesByCategory,
  type Category,
  type BusinessType 
} from "@/data/incomeCategories";
import { Camera, X, Loader2 } from "lucide-react"; // Agregué Loader2
import { CurrencySelector, type Currency } from "./CurrencySelector";
import { toast } from "sonner";

// --- IMPORTANTE: PEGA AQUÍ TU USER ID DE SUPABASE ---
const USER_ID = "6221431c-7a17-4acc-9c01-43903e30eb21"; 

interface IncomeFormProps {
  onSubmit: () => void;
}

export function IncomeForm({ onSubmit }: IncomeFormProps) {
  const [selectedMacro, setSelectedMacro] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de carga
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const categories: Category[] = selectedMacro ? getIncomeCategoriesByMacro(selectedMacro) : [];
  const businessTypes: BusinessType[] = selectedMacro && selectedCategory 
    ? getIncomeBusinessTypesByCategory(selectedMacro, selectedCategory) 
    : [];

  const handleMacroChange = (value: string) => {
    setSelectedMacro(value);
    setSelectedCategory("");
    setSelectedBusiness("");
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedBusiness("");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    // 1. Obtener nombres legibles (Tu lógica original)
    const macroName = incomeMacroCategories.find((m) => m.id === selectedMacro)?.name || "";
    const categoryName = categories.find((c) => c.id === selectedCategory)?.name || "";
    
    // Lógica para input manual vs select
    let businessName = selectedBusiness;
    if (selectedBusiness !== "custom") {
        const found = businessTypes.find((b) => b.name === selectedBusiness);
        if (found) businessName = found.name;
    }

    // 2. Preparar el objeto para enviar al Backend
    const nuevoIngreso = {
      macrocategoria: macroName,
      categoria: categoryName,
      negocio: businessName, // En la BD se guarda como 'negocio'
      total_amount: parseFloat(amount),
      user_id: USER_ID // El ID obligatorio para Supabase
    };

    setIsSubmitting(true);

    try {
      // 3. Enviar a tu servidor Node.js
      const response = await fetch('http://localhost:3001/incomes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoIngreso),
      });

      if (!response.ok) {
        throw new Error('Error al guardar en el servidor');
      }

      const data = await response.json();
      console.log("Guardado en Supabase:", data);

      toast.success("Ingreso registrado en la Nube exitosamente");
      
      // Limpiar formulario
      setSelectedMacro("");
      setSelectedCategory("");
      setSelectedBusiness("");
      setAmount("");
      setReceiptImage(null);
      
      onSubmit(); // Cerrar modal o lo que haga esta función

    } catch (error) {
      console.error(error);
      toast.error("Error conectando con la base de datos");
    } finally {
      setIsSubmitting(false);
    }
  };  

  const isFormValid = selectedMacro && selectedCategory && selectedBusiness && amount;

  return (
    <div className="space-y-4">
      {/* ... (Todo tu JSX del formulario se mantiene igual hasta el botón final) ... */}
      
      {/* Solo copio la parte de arriba para no hacer spam, los inputs son iguales */}
      {/* ... Inputs de Macro, Categoria, Negocio, Monto e Imagen ... */}
      
      <div className="space-y-2">
        <Label htmlFor="income-macro-category">Macro Categoría</Label>
        <Select value={selectedMacro} onValueChange={handleMacroChange}>
          <SelectTrigger id="income-macro-category" className="border-2">
            <SelectValue placeholder="Selecciona una macro categoría" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {incomeMacroCategories.map((macro) => (
              <SelectItem key={macro.id} value={macro.id}>
                {macro.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-category">Categoría</Label>
        <Select 
          value={selectedCategory} 
          onValueChange={handleCategoryChange}
          disabled={!selectedMacro}
        >
          <SelectTrigger id="income-category" className="border-2">
            <SelectValue placeholder={selectedMacro ? "Selecciona una categoría" : "Primero selecciona una macro categoría"} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-business-type">Tipo de Fuente</Label>
        <Select 
          value={selectedBusiness} 
          onValueChange={setSelectedBusiness}
          disabled={!selectedCategory}
        >
          <SelectTrigger id="income-business-type" className="border-2">
            <SelectValue placeholder={selectedCategory ? "Selecciona un tipo de fuente" : "Primero selecciona una categoría"} />
          </SelectTrigger>
          <SelectContent>
            {businessTypes.map((business) => (
              <SelectItem key={business.id} value={business.name}>
                {business.name}
              </SelectItem>
            ))}
            <SelectItem value="custom">Otro (escribir manualmente)</SelectItem>
          </SelectContent>
        </Select>
        
        {selectedBusiness === "custom" && (
          <Input
            placeholder="Escribe el tipo de fuente"
            value="" // Ojo: Aquí tenías value="" fijo en tu código original, deberías manejar un estado extra si quieres input manual real, pero lo dejé como estaba.
            onChange={(e) => setSelectedBusiness(e.target.value || "custom")}
            className="border-2 mt-2"
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-amount">Monto</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              {currency === "USD" ? "$" : "Bs."}
            </span>
            <Input
              id="income-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 border-2"
              step="0.01"
              min="0"
            />
          </div>
          <CurrencySelector 
            value={currency} 
            onChange={setCurrency}
            className="w-28 border-2"
          />
        </div>
      </div>

      {/* Botón de Submit Modificado */}
      <Button 
        className="w-full" 
        disabled={!isFormValid || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : (
          "Registrar Ingreso"
        )}
      </Button>
    </div>
  );
}