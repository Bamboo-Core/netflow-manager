import HostForm from "@/components/HostForm";

export default function NewHostPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Novo Host</h1>
        <p className="text-gray-400 mt-1">Cadastrar novo ativo de rede</p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <HostForm />
      </div>
    </div>
  );
}
