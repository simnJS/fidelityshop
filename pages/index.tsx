import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="flex flex-col items-center">
      <div className="max-w-4xl w-full text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-blue-400">
          Système de Points de Fidélité Minecraft
        </h1>
        <p className="text-xl mb-8 text-gray-300">
          Gagnez des points en effectuant des achats et échangez-les contre des récompenses exclusives !
        </p>
        
        {!session ? (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              S'inscrire
            </Link>
            <Link 
              href="/login" 
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Se connecter
            </Link>
          </div>
        ) : (
          <Link 
            href="/dashboard" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Accéder à mon tableau de bord
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full py-12">
        <FeatureCard 
          icon="🎮"
          title="Connectez votre compte Minecraft"
          description="Liez votre nom d'utilisateur Minecraft à votre profil pour recevoir vos récompenses."
        />
        <FeatureCard 
          icon="📸"
          title="Envoyez vos preuves d'achat"
          description="Téléchargez simplement une capture d'écran de votre achat pour recevoir des points."
        />
        <FeatureCard 
          icon="🎁"
          title="Échangez vos points"
          description="Utilisez vos points pour obtenir des avantages exclusifs sur notre serveur."
        />
      </div>

      <div className="w-full bg-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center text-blue-400">Comment ça marche ?</h2>
          
          <div className="flex flex-col gap-6">
            <Step 
              number="1" 
              title="Créez votre compte" 
              description="Inscrivez-vous en quelques secondes et associez votre nom Minecraft."
            />
            <Step 
              number="2" 
              title="Effectuez des achats" 
              description="Réalisez des achats sur notre serveur Minecraft ou notre boutique partenaire."
            />
            <Step 
              number="3" 
              title="Envoyez vos preuves d'achat" 
              description="Téléchargez une capture d'écran de votre achat sur votre tableau de bord."
            />
            <Step 
              number="4" 
              title="Recevez vos points" 
              description="Notre équipe validera votre achat et créditera vos points rapidement."
            />
            <Step 
              number="5" 
              title="Échangez vos récompenses" 
              description="Utilisez vos points dans notre boutique pour obtenir des avantages exclusifs."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-blue-400">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}

interface StepProps {
  number: string;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="flex items-start">
      <div className="bg-blue-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
        {number}
      </div>
      <div className="ml-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-gray-300">{description}</p>
      </div>
    </div>
  );
}
